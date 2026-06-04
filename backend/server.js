// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
const authRouter     = require('./routes/auth');
const productsRouter = require('./routes/products');
const customersRouter= require('./routes/customers');
const salesRouter    = require('./routes/sales');
const dashboardRouter= require('./routes/dashboard');
const reportsRouter  = require('./routes/reports');

// Categories are handled inside the products router
// but we also expose them at /api/categories for the frontend
const Category = require('./models/Category');
const { verifyToken, requireAdmin } = require('./middleware/auth');

app.use('/api/auth',      authRouter);
app.use('/api/products',  productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales',     salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports',   reportsRouter);

// ─────────────────────────────────────────────
// /api/categories  — standalone CRUD (mirrors products router categories)
// ─────────────────────────────────────────────
app.get('/api/categories', verifyToken, async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

app.post('/api/categories', verifyToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  const n = (name || '').trim();
  if (!n) return res.status(400).json({ message: 'Name is required' });

  try {
    const dup = await Category.findOne({ name: { $regex: `^${n}$`, $options: 'i' } });
    if (dup) return res.status(409).json({ message: 'Category already exists' });

    const cat = await Category.create({ name: n, description: description || null });
    res.status(201).json({ id: cat._id, name: cat.name });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Category already exists' });
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

app.put('/api/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const n = (req.body.name || '').trim();
  if (!n) return res.status(400).json({ message: 'Category name is required' });

  try {
    const dup = await Category.findOne({
      name: { $regex: `^${n}$`, $options: 'i' },
      _id: { $ne: id },
    });
    if (dup) return res.status(409).json({ message: 'Category name already exists' });

    const result = await Category.findByIdAndUpdate(id, { name: n }, { new: true });
    if (!result) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.delete('/api/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const Product = require('./models/Product');
    const cnt = await Product.countDocuments({ categoryId: new mongoose.Types.ObjectId(id) });
    if (cnt > 0) {
      return res.status(409).json({ message: 'Cannot delete: products are linked to this category' });
    }

    const result = await Category.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'Server running successfully',
    timestamp: new Date().toISOString(),
    databases: {
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    },
  });
});

// ─────────────────────────────────────────────
// 404 + error handler
// ─────────────────────────────────────────────
app.use('*', (_req, res) => res.status(404).json({ message: 'API route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ─────────────────────────────────────────────
// Seed initial data (idempotent)
// ─────────────────────────────────────────────
async function seedData() {
  const User     = require('./models/User');
  const Product  = require('./models/Product');
  const Customer = require('./models/Customer');

  // Seed users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create([
      {
        username: 'admin',
        password: 'admin123',   // pre-save hook hashes this
        role: 'admin',
        name: 'Administrator',
        email: 'admin@pos.com',
      },
      {
        username: 'cashier',
        password: 'cashier123',
        role: 'cashier',
        name: 'Cashier User',
        email: 'cashier@pos.com',
      },
    ]);
    console.log('✅ Default users seeded (admin / admin123, cashier / cashier123)');
  }

  // Seed categories
  const catCount = await Category.countDocuments();
  let electronics, office;
  if (catCount === 0) {
    [electronics, office] = await Category.create([
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Office Supplies', description: 'Office and business supplies' },
    ]);
    console.log('✅ Default categories seeded');
  } else {
    electronics = await Category.findOne({ name: 'Electronics' });
    office      = await Category.findOne({ name: 'Office Supplies' });
  }

  // Seed products
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.create([
      { name: 'Laptop',           description: 'High-performance laptop',       price: 999.99, stock: 15, minStock: 5,  barcode: 'LAP001', categoryId: electronics?._id },
      { name: 'Wireless Mouse',   description: 'Ergonomic wireless mouse',      price:  29.99, stock: 50, minStock: 10, barcode: 'MOU001', categoryId: electronics?._id },
      { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard',    price:  79.99, stock: 25, minStock: 5,  barcode: 'KEY001', categoryId: electronics?._id },
      { name: 'Monitor 24"',      description: '24-inch LED monitor',           price: 299.99, stock:  8, minStock: 3,  barcode: 'MON001', categoryId: electronics?._id },
      { name: 'Notebook',         description: 'Spiral notebook 200 pages',     price:   5.99, stock:100, minStock: 20, barcode: 'NOT001', categoryId: office?._id },
      { name: 'Blue Pen',         description: 'Blue ballpoint pen',            price:   1.99, stock:200, minStock: 50, barcode: 'PEN001', categoryId: office?._id },
    ]);
    console.log('✅ Default products seeded');
  }

  // Seed customers
  const custCount = await Customer.countDocuments();
  if (custCount === 0) {
    await Customer.create([
      { name: 'John Doe',    email: 'john@example.com', phone: '123-456-7890', address: '123 Main St' },
      { name: 'Jane Smith',  email: 'jane@example.com', phone: '098-765-4321', address: '456 Oak Ave' },
      { name: 'Bob Johnson', email: 'bob@example.com',  phone: '555-123-4567', address: '789 Pine Rd' },
    ]);
    console.log('✅ Default customers seeded');
  }
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system');
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);

    await seedData();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
