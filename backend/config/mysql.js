const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pos_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

const connectMySQL = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ MySQL Connected successfully');
    connection.release();
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
    console.log('📝 Continuing without MySQL for now...');
  }
};

module.exports = { pool: promisePool, connectMySQL };