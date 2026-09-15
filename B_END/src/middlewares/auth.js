const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '15m';

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (userId) => {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS) || 7;
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: `${days}d` });
};

/**
 * Middleware: Verify JWT and attach user to req
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email,
              u.role_id, u.schedule_id, u.department, u.position, u.phone,
              u.avatar, u.status, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'ผู้ใช้ไม่พบหรือถูกระงับ' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
  }
};

/**
 * Middleware: Role-based authorization
 * Usage: authorize('admin', 'super_admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, generateAccessToken, generateRefreshToken, JWT_SECRET };
