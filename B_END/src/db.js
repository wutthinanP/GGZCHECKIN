const { Pool } = require('pg');

// Fail-safe check for database configuration
const requiredDbEnv = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingDbEnv = requiredDbEnv.filter((key) => !process.env[key]);
if (missingDbEnv.length > 0) {
  throw new Error(
    `FATAL CONFIGURATION ERROR: Missing required database configuration: ${missingDbEnv.join(', ')}. System failed safely.`
  );
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
