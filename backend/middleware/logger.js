const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware factory: logs user activity to MongoDB after a route handler succeeds.
 * Usage: router.post('/login', logActivity('login'), handler)
 */
const logActivity = (action) => async (req, res, next) => {
  // Wrap res.json to intercept response and log after success
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    // Only log if response is success (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        await ActivityLog.create({
          userId: req.user._id,
          username: req.user.username,
          action,
          details: req.body || {},
        });
      } catch (err) {
        // Non-critical — don't block the response
        console.error('Activity log error:', err.message);
      }
    }
    return originalJson(data);
  };

  next();
};

/**
 * Standalone function to log activity (for use inside route handlers directly)
 */
const log = async (user, action, details = {}) => {
  if (!user) return;
  try {
    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      action,
      details,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity, log };
