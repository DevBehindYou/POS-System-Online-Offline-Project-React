// backend/config/mongodb.js - CLEAN VERSION
const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_logs'
    );
    console.log('✅ MongoDB Connected:', conn.connection.host);
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('📝 Continuing without MongoDB for now...');
  }
};

module.exports = connectMongoDB;