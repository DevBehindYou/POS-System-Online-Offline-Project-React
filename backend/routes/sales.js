const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const { verifyToken, requireStaff } = require('../middleware/auth');
const { validateSaleData } = require('../middleware/validation');
const { log } = require('../middleware/logger');
const router = express.Router();

// ──────────────────────────────────────────────
// Invoice number generator
// ──────────────────────────────────────────────
const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const ts = now.getTime().toString().slice(-6);
  return `INV-${year}${month}${day}-${ts}`;
};

// ──────────────────────────────────────────────
// POST /api/sales  — create sale (with Mongoose session)
// ──────────────────────────────────────────────
router.post('/', verifyToken, requireStaff, validateSaleData, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      customer_id,
      items,
      tax_rate = 0,
      discount_amount = 0,
      payment_method = 'cash',
    } = req.body;

    // Validate customer if provided
    if (customer_id) {
      if (!mongoose.Types.ObjectId.isValid(customer_id)) {
        throw new Error('Invalid customer ID');
      }
      const customer = await Customer.findById(customer_id).session(session);
      if (!customer) throw new Error('Customer not found');
    }

    let subtotal = 0;
    const processedItems = [];

    // Validate and process each item
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        throw new Error(`Invalid product ID: ${item.product_id}`);
      }

      const product = await Product.findOne({
        _id: item.product_id,
        isActive: true,
      }).session(session);

      if (!product) {
        throw new Error(`Product "${item.product_id}" not found or inactive`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      const unitPrice = item.unit_price != null ? Number(item.unit_price) : product.price;
      const totalPrice = unitPrice * Number(item.quantity);

      processedItems.push({
        productId: product._id,
        productName: product.name,
        barcode: product.barcode || null,
        quantity: Number(item.quantity),
        unitPrice,
        totalPrice,
      });

      subtotal += totalPrice;
    }

    // Totals
    const taxAmount = (subtotal * Number(tax_rate)) / 100;
    const finalDiscount = Math.min(Number(discount_amount), subtotal + taxAmount);
    const totalAmount = subtotal + taxAmount - finalDiscount;

    if (totalAmount < 0) throw new Error('Total amount cannot be negative');

    const invoiceNumber = generateInvoiceNumber();

    // Create sale
    const [sale] = await Sale.create(
      [
        {
          invoiceNumber,
          customerId: customer_id || null,
          userId: req.user._id,
          items: processedItems,
          subtotal,
          taxAmount,
          discountAmount: finalDiscount,
          totalAmount,
          paymentMethod: payment_method,
        },
      ],
      { session }
    );

    // Decrement product stock atomically
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();

    // Post-commit: low-stock notifications (best-effort)
    for (const item of processedItems) {
      try {
        const updated = await Product.findById(item.productId);
        if (updated && updated.stock <= updated.minStock) {
          await Notification.create({
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `"${updated.name}" is below min stock after sale`,
            severity: 'high',
            metadata: {
              productId: updated._id,
              stockLevel: updated.stock,
              threshold: updated.minStock,
            },
          });
        }
      } catch (_) {}
    }

    await log(req.user, 'sale_created', { saleId: sale._id, invoiceNumber, totalAmount });

    res.status(201).json({
      message: 'Sale completed successfully',
      sale: {
        id: sale._id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        items_count: processedItems.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create sale error:', error.message);

    if (
      error.message.includes('Insufficient stock') ||
      error.message.includes('not found') ||
      error.message.includes('Invalid')
    ) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error during sale creation' });
  } finally {
    session.endSession();
  }
});

// ──────────────────────────────────────────────
// GET /api/sales  — paginated list with filters
// ──────────────────────────────────────────────
router.get('/', verifyToken, requireStaff, async (req, res) => {
  const {
    page = 1,
    limit = 20,
    start_date,
    end_date,
    payment_method,
    cashier_id,
    customer_id,
  } = req.query;

  try {
    const filter = {};

    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date + 'T00:00:00.000Z');
      if (end_date) filter.createdAt.$lte = new Date(end_date + 'T23:59:59.999Z');
    }

    if (payment_method) filter.paymentMethod = payment_method;

    if (cashier_id && mongoose.Types.ObjectId.isValid(cashier_id)) {
      filter.userId = new mongoose.Types.ObjectId(cashier_id);
    }

    if (customer_id && mongoose.Types.ObjectId.isValid(customer_id)) {
      filter.customerId = new mongoose.Types.ObjectId(customer_id);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customerId', 'name phone')
        .populate('userId', 'username name')
        .lean(),
      Sale.countDocuments(filter),
    ]);

    const formatted = sales.map((s) => ({
      ...s,
      customer_name: s.customerId?.name || 'Walk-in Customer',
      customer_phone: s.customerId?.phone || null,
      cashier_name: s.userId?.username || 'Unknown',
      items_count: s.items?.length || 0,
    }));

    res.json({
      sales: formatted,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSales: total,
        hasNext: skip + sales.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get sales error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/sales/:id  — single sale with items
// ──────────────────────────────────────────────
router.get('/:id', verifyToken, requireStaff, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid sale ID' });
    }

    const sale = await Sale.findById(id)
      .populate('customerId', 'name phone email address')
      .populate('userId', 'username name')
      .lean();

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({
      sale: {
        ...sale,
        customer_name: sale.customerId?.name || 'Walk-in Customer',
        customer_phone: sale.customerId?.phone || null,
        customer_email: sale.customerId?.email || null,
        customer_address: sale.customerId?.address || null,
        cashier_name: sale.userId?.username || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Get sale error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/sales/reports/summary  — KPI summary
// ──────────────────────────────────────────────
router.get('/reports/summary', verifyToken, requireStaff, async (req, res) => {
  const { period = 'today', start_date, end_date } = req.query;

  try {
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today': {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfDay } };
        break;
      }
      case 'week':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 3600 * 1000) } };
        break;
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      }
      case 'custom':
        if (!start_date || !end_date) {
          return res.status(400).json({ message: 'start_date and end_date required for custom period' });
        }
        dateFilter = {
          createdAt: {
            $gte: new Date(start_date + 'T00:00:00.000Z'),
            $lte: new Date(end_date + 'T23:59:59.999Z'),
          },
        };
        break;
      default:
        dateFilter = { createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
    }

    const [summary] = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total_sales: { $sum: 1 },
          total_revenue: { $sum: '$totalAmount' },
          average_sale_amount: { $avg: '$totalAmount' },
          total_tax: { $sum: '$taxAmount' },
          total_discount: { $sum: '$discountAmount' },
        },
      },
    ]);

    const paymentBreakdown = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total_amount: { $sum: '$totalAmount' },
        },
      },
      { $project: { payment_method: '$_id', count: 1, total_amount: 1, _id: 0 } },
    ]);

    const topProducts = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          barcode: { $first: '$items.barcode' },
          total_quantity: { $sum: '$items.quantity' },
          total_revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { total_quantity: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      summary: summary || {
        total_sales: 0,
        total_revenue: 0,
        average_sale_amount: 0,
        total_tax: 0,
        total_discount: 0,
      },
      payment_breakdown: paymentBreakdown,
      top_products: topProducts,
      period,
      date_range: { start: start_date, end: end_date },
    });
  } catch (error) {
    console.error('Get sales report error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/sales/reports/daily  — daily data for charts
// ──────────────────────────────────────────────
router.get('/reports/daily', verifyToken, requireStaff, async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    since.setHours(0, 0, 0, 0);

    const dailyData = await Sale.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales_count: { $sum: 1 },
          total_revenue: { $sum: '$totalAmount' },
          total_tax: { $sum: '$taxAmount' },
          total_discount: { $sum: '$discountAmount' },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', sales_count: 1, total_revenue: 1, total_tax: 1, total_discount: 1, _id: 0 } },
    ]);

    res.json({ daily_data: dailyData });
  } catch (error) {
    console.error('Get daily sales error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;