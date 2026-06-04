/**
 * Validate product data on create/update requests
 */
const validateProductData = (req, res, next) => {
  const { name, price, stock } = req.body;

  if (!name || String(name).trim().length < 1) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: 'Valid price is required (must be >= 0)' });
  }

  if (stock === undefined || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ message: 'Valid stock quantity is required (must be >= 0)' });
  }

  next();
};

/**
 * Validate sale data on create requests
 */
const validateSaleData = (req, res, next) => {
  const { items, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Sale must include at least one item' });
  }

  for (const item of items) {
    if (!item.product_id) {
      return res.status(400).json({ message: 'Each sale item must have a product_id' });
    }
    if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) < 1) {
      return res.status(400).json({ message: 'Each item must have a valid quantity (>= 1)' });
    }
  }

  const validMethods = ['cash', 'card', 'upi'];
  if (!payment_method || !validMethods.includes(payment_method)) {
    return res.status(400).json({
      message: `payment_method must be one of: ${validMethods.join(', ')}`,
    });
  }

  next();
};

module.exports = { validateProductData, validateSaleData };
