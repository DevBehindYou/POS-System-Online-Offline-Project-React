// backend/routes/dashboard.js
const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { verifyToken, requireStaff } = require('../middleware/auth');
const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/dashboard/overview
// ──────────────────────────────────────────────
router.get('/overview', verifyToken, requireStaff, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000);

    // Run all aggregations in parallel
    const [
      todaySales,
      monthSales,
      productStats,
      customerCount,
      recentSales,
      lowStockProducts,
      topProducts,
      salesTrend,
    ] = await Promise.all([
      // Today's KPIs
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            today_sales_count: { $sum: 1 },
            today_revenue: { $sum: '$totalAmount' },
          },
        },
      ]),

      // Month KPIs
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            month_sales_count: { $sum: 1 },
            month_revenue: { $sum: '$totalAmount' },
          },
        },
      ]),

      // Product stats
      Product.aggregate([
        {
          $group: {
            _id: null,
            total_products: { $sum: 1 },
            active_products: {
              $sum: { $cond: ['$isActive', 1, 0] },
            },
            low_stock_products: {
              $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] },
            },
          },
        },
      ]),

      // Customer count
      Customer.countDocuments({}),

      // Recent sales (last 5)
      Sale.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .populate('userId', 'username')
        .lean(),

      // Low stock products
      Product.find({ isActive: true, $expr: { $lte: ['$stock', '$minStock'] } })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock minStock price')
        .lean(),

      // Top products this month
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.productName' },
            total_sold: { $sum: '$items.quantity' },
            total_revenue: { $sum: '$items.totalPrice' },
          },
        },
        { $sort: { total_sold: -1 } },
        { $limit: 5 },
      ]),

      // Sales trend — last 7 days
      Sale.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales_count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', sales_count: 1, revenue: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      today: {
        sales_count: todaySales[0]?.today_sales_count || 0,
        revenue: todaySales[0]?.today_revenue || 0,
      },
      month: {
        sales_count: monthSales[0]?.month_sales_count || 0,
        revenue: monthSales[0]?.month_revenue || 0,
      },
      products: {
        total: productStats[0]?.total_products || 0,
        active: productStats[0]?.active_products || 0,
        low_stock: productStats[0]?.low_stock_products || 0,
      },
      customers: { total: customerCount },
      recent_sales: recentSales.map((s) => ({
        id: s._id,
        invoice_number: s.invoiceNumber,
        total_amount: s.totalAmount,
        sale_date: s.createdAt,
        customer_name: s.customerId?.name || 'Walk-in Customer',
        cashier_name: s.userId?.username || 'Unknown',
      })),
      low_stock_products: lowStockProducts.map((p) => ({
        id: p._id,
        name: p.name,
        stock_quantity: p.stock,
        min_stock_level: p.minStock,
        selling_price: p.price,
      })),
      top_products: topProducts,
      sales_trend: salesTrend,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/dashboard/notifications
// ──────────────────────────────────────────────
router.get('/notifications', verifyToken, requireStaff, async (req, res) => {
  const { page = 1, limit = 20, unread_only = 'false' } = req.query;

  try {
    const filter = {};

    if (req.user.role === 'cashier') {
      filter.$or = [{ userId: req.user._id }, { userId: null }];
    }

    if (unread_only === 'true') {
      filter.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalNotifications: total,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/dashboard/notifications/:id/read
// ──────────────────────────────────────────────
router.patch('/notifications/:id/read', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/dashboard/activity
// ──────────────────────────────────────────────
router.get('/activity', verifyToken, requireStaff, async (req, res) => {
  const { page = 1, limit = 20, action, user_id } = req.query;

  try {
    const filter = {};

    if (action) filter.action = action;

    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      filter.userId = new mongoose.Types.ObjectId(user_id);
    }

    // Cashiers can only see their own activity
    if (req.user.role === 'cashier') {
      filter.userId = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalActivities: total,
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
