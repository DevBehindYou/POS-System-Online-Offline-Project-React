// backend/routes/reports.js
const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const router = express.Router();

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getRangeBounds(range = '7d') {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  if (range === '30d') start.setDate(end.getDate() - 29);
  else if (range === '90d') start.setDate(end.getDate() - 89);
  else if (range === '6m') {
    start.setMonth(end.getMonth() - 5);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    // default: 7d
    start.setDate(end.getDate() - 6);
  }

  return { start, end };
}

/**
 * Returns a MongoDB $dateToString format string based on grouping range.
 * Monthly for 6m, daily for all others.
 */
function getGroupFormat(range) {
  return range === '6m' ? '%Y-%m-01' : '%Y-%m-%d';
}

// ──────────────────────────────────────────────
// GET /api/reports/sales  — KPIs + time series + breakdown
// ──────────────────────────────────────────────
router.get('/sales', async (req, res) => {
  try {
    const range = (req.query.range || '7d').toLowerCase();
    const { start, end } = getRangeBounds(range);
    const format = getGroupFormat(range);

    const dateMatch = { createdAt: { $gte: start, $lte: end } };

    const [summary, series, payments, topProducts] = await Promise.all([
      // KPIs
      Sale.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            tax: { $sum: '$taxAmount' },
            discounts: { $sum: '$discountAmount' },
          },
        },
      ]),

      // Time series
      Sale.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format, date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { period: '$_id', orders: 1, revenue: 1, _id: 0 } },
      ]),

      // Payment method breakdown
      Sale.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$paymentMethod',
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $project: { method: '$_id', orders: 1, revenue: 1, _id: 0 } },
      ]),

      // Top 5 products
      Sale.aggregate([
        { $match: dateMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.productName' },
            qty: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $project: { id: '$_id', name: 1, qty: 1, revenue: 1, _id: 0 } },
      ]),
    ]);

    const s = summary[0] || { orders: 0, revenue: 0, tax: 0, discounts: 0 };
    const avgOrder = s.orders ? s.revenue / s.orders : 0;

    res.json({
      range,
      bounds: { start: start.toISOString(), end: end.toISOString() },
      kpis: {
        revenue: Number(s.revenue.toFixed(2)),
        orders: Number(s.orders),
        avgOrder: Number(avgOrder.toFixed(2)),
        tax: Number(s.tax.toFixed(2)),
        discounts: Number(s.discounts.toFixed(2)),
      },
      series: series.map((r) => ({
        period: r.period,
        orders: Number(r.orders),
        revenue: Number(r.revenue.toFixed(2)),
      })),
      payments: payments.map((p) => ({
        method: p.method,
        orders: Number(p.orders),
        revenue: Number(p.revenue.toFixed(2)),
      })),
      topProducts: topProducts.map((t) => ({
        id: t.id,
        name: t.name,
        qty: Number(t.qty),
        revenue: Number(t.revenue.toFixed(2)),
      })),
    });
  } catch (e) {
    console.error('GET /api/reports/sales', e);
    res.status(500).json({ message: 'Failed to build report' });
  }
});

// ──────────────────────────────────────────────
// GET /api/reports/sales/export  — CSV download
// ──────────────────────────────────────────────
router.get('/sales/export', async (req, res) => {
  try {
    const range = (req.query.range || '7d').toLowerCase();
    const { start, end } = getRangeBounds(range);
    const format = getGroupFormat(range);

    const series = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let csv = 'period,orders,revenue\n';
    for (const r of series) {
      csv += `${r._id},${r.orders},${Number(r.revenue).toFixed(2)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales_${range}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('GET /api/reports/sales/export', e);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
