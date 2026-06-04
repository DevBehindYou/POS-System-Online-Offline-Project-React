const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'sale_created',
        'product_added',
        'product_updated',
        'product_deleted',
        'stock_updated',
        'customer_created',
        'customer_updated',
        'customer_deleted',
        'category_created',
        'category_updated',
        'category_deleted',
      ],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);