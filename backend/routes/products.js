const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const { verifyToken, requireAdmin, requireStaff } = require('../middleware/auth');
const { validateProductData } = require('../middleware/validation');
const { log } = require('../middleware/logger');
const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/products  — list with pagination, search, filter
// ──────────────────────────────────────────────
router.get('/', verifyToken, requireStaff, async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    category = '',
    status = 'all',
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query;

  try {
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.categoryId = new mongoose.Types.ObjectId(category);
    }

    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
    else if (status === 'low_stock') {
      // handled via aggregation below
    }

    const validSortFields = { name: 1, price: 1, stock: 1, createdAt: 1 };
    const sortField = validSortFields[sortBy] !== undefined ? sortBy : 'name';
    const sortDir = sortOrder.toLowerCase() === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregation to join category name + isLowStock flag
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          category_name: { $ifNull: ['$category.name', null] },
          isLowStock: { $lte: ['$stock', '$minStock'] },
        },
      },
    ];

    if (status === 'low_stock') {
      pipeline.push({ $match: { isLowStock: true } });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];

    pipeline.push(
      { $sort: { [sortField]: sortDir } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          category: 0, // remove the raw lookup array
        },
      }
    );

    const [products, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/products/search  — quick search by name/barcode
// ──────────────────────────────────────────────
router.get('/search', verifyToken, requireStaff, async (req, res) => {
  const { q = '' } = req.query;
  try {
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(10)
      .lean();
    res.json(products);
  } catch (error) {
    console.error('Product search error:', error.message);
    res.status(500).json({ message: 'Search failed' });
  }
});

// ──────────────────────────────────────────────
// GET /api/products/categories/list  — all categories with product count
// ──────────────────────────────────────────────
router.get('/categories/list', verifyToken, requireStaff, async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $addFields: {
          product_count: {
            $size: {
              $filter: {
                input: '$products',
                as: 'p',
                cond: { $eq: ['$$p.isActive', true] },
              },
            },
          },
        },
      },
      { $project: { products: 0 } },
      { $sort: { name: 1 } },
    ]);
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// POST /api/products/categories  — create category
// ──────────────────────────────────────────────
router.post('/categories', verifyToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Category name must be at least 2 characters' });
    }

    const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name: name.trim(), description: description || null });

    res.status(201).json({ message: 'Category created successfully', categoryId: category._id });
  } catch (error) {
    console.error('Create category error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/products/:id  — single product
// ──────────────────────────────────────────────
router.get('/:id', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    // Support lookup by ObjectId or barcode
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const product = await Product.findOne(query).populate('categoryId', 'name').lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.category_name = product.categoryId?.name || null;
    product.isLowStock = product.stock <= product.minStock;

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// POST /api/products  — create product
// ──────────────────────────────────────────────
router.post('/', verifyToken, requireAdmin, validateProductData, async (req, res) => {
  const { name, description, price, stock, minStock = 5, barcode, category_id } = req.body;

  try {
    // Check barcode uniqueness
    if (barcode) {
      const dup = await Product.findOne({ barcode: barcode.trim() });
      if (dup) {
        return res.status(400).json({ message: 'Product with this barcode already exists' });
      }
    }

    // Verify category exists
    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      const cat = await Category.findById(category_id);
      if (!cat) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    const product = await Product.create({
      name: name.trim(),
      description: description || null,
      price: Number(price),
      stock: Number(stock),
      minStock: Number(minStock),
      barcode: barcode?.trim() || null,
      categoryId: category_id || null,
    });

    // Low stock notification on creation
    if (product.stock <= product.minStock) {
      await Notification.create({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is at or below minimum stock level`,
        severity: 'medium',
        metadata: { productId: product._id, stockLevel: product.stock, threshold: product.minStock },
      });
    }

    await log(req.user, 'product_added', { productId: product._id, name: product.name });

    res.status(201).json({ message: 'Product created successfully', productId: product._id });
  } catch (error) {
    console.error('Create product error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product with this barcode already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PUT /api/products/:id  — update product
// ──────────────────────────────────────────────
router.put('/:id', verifyToken, requireAdmin, validateProductData, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, minStock, barcode, category_id, isActive } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check barcode uniqueness against other products
    if (barcode && barcode !== product.barcode) {
      const dup = await Product.findOne({ barcode: barcode.trim(), _id: { $ne: id } });
      if (dup) {
        return res.status(400).json({ message: 'Barcode already exists for another product' });
      }
    }

    // Verify category
    if (category_id && !mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const prevStock = product.stock;
    const newStock = stock !== undefined ? Number(stock) : product.stock;
    const newMinStock = minStock !== undefined ? Number(minStock) : product.minStock;

    await Product.findByIdAndUpdate(
      id,
      {
        name: name?.trim() ?? product.name,
        description: description !== undefined ? description || null : product.description,
        price: price !== undefined ? Number(price) : product.price,
        stock: newStock,
        minStock: newMinStock,
        barcode: barcode !== undefined ? barcode?.trim() || null : product.barcode,
        categoryId: category_id !== undefined ? category_id || null : product.categoryId,
        isActive: isActive !== undefined ? isActive : product.isActive,
      },
      { runValidators: true }
    );

    // Low stock notification if threshold crossed
    if (newStock <= newMinStock && prevStock > product.minStock) {
      await Notification.create({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is now below minimum stock level`,
        severity: 'medium',
        metadata: { productId: product._id, stockLevel: newStock, threshold: newMinStock },
      });
    }

    await log(req.user, 'product_updated', { productId: id, name });

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/products/:id/stock  — update stock only
// ──────────────────────────────────────────────
router.patch('/:id/stock', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body;

  try {
    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.stock + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stock - parseInt(quantity));
        break;
      default:
        newQuantity = parseInt(quantity);
    }

    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative' });
    }

    const prevStock = product.stock;
    await Product.findByIdAndUpdate(id, { stock: newQuantity });

    // Notify if threshold crossed
    if (newQuantity <= product.minStock && prevStock > product.minStock) {
      await Notification.create({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is now below minimum stock level`,
        severity: 'medium',
        metadata: { productId: product._id, stockLevel: newQuantity, threshold: product.minStock },
      });
    }

    await log(req.user, 'stock_updated', { productId: id, operation, quantity, newQuantity });

    res.json({ message: 'Stock updated successfully', previousQuantity: prevStock, newQuantity });
  } catch (error) {
    console.error('Update stock error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/products/:id  — soft or hard delete
// ──────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is used in any sale
    const Sale = require('../models/Sale');
    const saleCount = await Sale.countDocuments({ 'items.productId': new mongoose.Types.ObjectId(id) });

    if (saleCount > 0) {
      // Soft delete — mark inactive
      await Product.findByIdAndUpdate(id, { isActive: false });
      await log(req.user, 'product_deleted', { productId: id, name: product.name, action: 'deactivated' });
      return res.json({ message: 'Product deactivated (has sale history)', action: 'deactivated' });
    }

    await Product.findByIdAndDelete(id);
    await log(req.user, 'product_deleted', { productId: id, name: product.name, action: 'deleted' });

    res.json({ message: 'Product deleted successfully', action: 'deleted' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;