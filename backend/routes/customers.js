// backend/routes/customers.js
const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { verifyToken, requireStaff } = require('../middleware/auth');
const { log } = require('../middleware/logger');
const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/customers  — paginated list with search
// ──────────────────────────────────────────────
router.get('/', verifyToken, requireStaff, async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  try {
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Customer.countDocuments(filter),
    ]);

    // Enrich with sale stats via aggregation
    const customerIds = customers.map((c) => c._id);
    const saleStats = await Sale.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      {
        $group: {
          _id: '$customerId',
          total_orders: { $sum: 1 },
          total_spent: { $sum: '$totalAmount' },
          last_purchase_date: { $max: '$createdAt' },
        },
      },
    ]);

    const statsMap = Object.fromEntries(saleStats.map((s) => [s._id.toString(), s]));

    const enriched = customers.map((c) => {
      const stats = statsMap[c._id.toString()] || {};
      return {
        ...c,
        total_orders: stats.total_orders || 0,
        total_spent: stats.total_spent || 0,
        last_purchase_date: stats.last_purchase_date || null,
      };
    });

    res.json({
      customers: enriched,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCustomers: total,
        hasNext: skip + customers.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get customers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/customers/search  — quick search
router.get('/search', verifyToken, requireStaff, async (req, res) => {
  const { q = '' } = req.query;
  try {
    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(10)
      .lean();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Customer search failed' });
  }
});

// ──────────────────────────────────────────────
// GET /api/customers/:id  — single customer + recent purchases
// ──────────────────────────────────────────────
router.get('/:id', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Sale stats
    const [stats] = await Sale.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          total_spent: { $sum: '$totalAmount' },
          last_purchase_date: { $max: '$createdAt' },
        },
      },
    ]);

    // Recent purchases (last 10)
    const recentPurchases = await Sale.find({ customerId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('invoiceNumber totalAmount createdAt items')
      .lean();

    res.json({
      customer: {
        ...customer,
        total_orders: stats?.total_orders || 0,
        total_spent: stats?.total_spent || 0,
        last_purchase_date: stats?.last_purchase_date || null,
        recent_purchases: recentPurchases.map((s) => ({
          id: s._id,
          invoice_number: s.invoiceNumber,
          total_amount: s.totalAmount,
          sale_date: s.createdAt,
          items_count: s.items?.length || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Get customer error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// POST /api/customers  — create
// ──────────────────────────────────────────────
router.post('/', verifyToken, requireStaff, async (req, res) => {
  const { name, phone, email, address } = req.body;

  try {
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Customer name must be at least 2 characters' });
    }

    // Check phone / email uniqueness
    if (phone || email) {
      const conditions = [];
      if (phone) conditions.push({ phone });
      if (email) conditions.push({ email: email.toLowerCase() });
      const dup = await Customer.findOne({ $or: conditions });
      if (dup) {
        return res.status(400).json({ message: 'Customer with this phone or email already exists' });
      }
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone || null,
      email: email?.toLowerCase() || null,
      address: address || null,
    });

    await log(req.user, 'customer_created', { customerId: customer._id, name: customer.name });

    res.status(201).json({ message: 'Customer created successfully', customerId: customer._id });
  } catch (error) {
    console.error('Create customer error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PUT /api/customers/:id  — update
// ──────────────────────────────────────────────
router.put('/:id', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  try {
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Customer name must be at least 2 characters' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const existing = await Customer.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check phone / email uniqueness against other customers
    if (phone || email) {
      const conditions = [];
      if (phone) conditions.push({ phone });
      if (email) conditions.push({ email: email.toLowerCase() });
      const dup = await Customer.findOne({ $or: conditions, _id: { $ne: id } });
      if (dup) {
        return res.status(400).json({ message: 'Phone or email already exists for another customer' });
      }
    }

    await Customer.findByIdAndUpdate(id, {
      name: name.trim(),
      phone: phone || null,
      email: email?.toLowerCase() || null,
      address: address || null,
    });

    await log(req.user, 'customer_updated', { customerId: id, name });

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/customers/:id  — delete (if no sales)
// ──────────────────────────────────────────────
router.delete('/:id', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const salesCount = await Sale.countDocuments({ customerId: new mongoose.Types.ObjectId(id) });

    if (salesCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete customer with existing sales history',
        sales_count: salesCount,
      });
    }

    const result = await Customer.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await log(req.user, 'customer_deleted', { customerId: id });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;