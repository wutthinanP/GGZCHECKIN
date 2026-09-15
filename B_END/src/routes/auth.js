const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticate, generateAccessToken, generateRefreshToken, JWT_SECRET } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/mailer');

// ─── In-memory OTP store (production: use Redis) ───
const otpStore = new Map(); // email -> { otp, expiresAt }

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const { rows } = await pool.query(
      `SELECT u.*, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'บัญชีของคุณถูกระงับ กรุณาติดต่อ Admin' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent)
       VALUES ($1, 'LOGIN', $2, $3)`,
      [user.id, req.ip, req.headers['user-agent']]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        employeeCode: user.employee_code,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role_name,
        department: user.department,
        position: user.position,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/refresh
// ──────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'กรุณาระบุ refresh token' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
    }

    const { rows } = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND status = 'active'`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'ผู้ใช้ไม่พบ' });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token ไม่ถูกต้องหรือหมดอายุ' });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email,
              u.department, u.position, u.phone, u.avatar, u.status,
              u.schedule_id, r.name as role_name,
              ws.name as schedule_name, ws.start_time, ws.end_time
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN work_schedules ws ON u.schedule_id = ws.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const u = rows[0];
    res.json({
      id: u.id,
      employeeCode: u.employee_code,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role_name,
      department: u.department,
      position: u.position,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      schedule: u.schedule_id
        ? { id: u.schedule_id, name: u.schedule_name, startTime: u.start_time, endTime: u.end_time }
        : null,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ──────────────────────────────────────────────
// PUT /api/auth/change-password
// ──────────────────────────────────────────────
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const { rows } = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.id]
    );

    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, req.user.id]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/forgot-password  (send OTP)
// ──────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมล' });
    }

    const { rows } = await pool.query(
      `SELECT id, email FROM users WHERE email = $1 AND status = 'active'`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Don't reveal whether email exists
      return res.json({ message: 'หากอีเมลนี้มีอยู่ในระบบ จะได้รับรหัส OTP ทางอีเมล' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.toLowerCase().trim(), {
      otp,
      userId: rows[0].id,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    await sendOtpEmail(email, otp);

    res.json({ message: 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/verify-otp
// ──────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัส OTP' });
    }

    const stored = otpStore.get(email.toLowerCase().trim());
    if (!stored) {
      return res.status(400).json({ error: 'ไม่พบรหัส OTP กรุณาขอใหม่' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ error: 'รหัส OTP หมดอายุ กรุณาขอใหม่' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign(
      { userId: stored.userId, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    otpStore.delete(email.toLowerCase().trim());

    res.json({ message: 'ยืนยัน OTP สำเร็จ', resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/reset-password
// ──────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Token ไม่ถูกต้อง' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, decoded.userId]);

    res.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token หมดอายุ กรุณาขอ OTP ใหม่' });
    }
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
