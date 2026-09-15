const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes (เปิดแค่ auth + attendance สำหรับ Login / Check-in / Check-out)
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// ─── Realtime SSE Stream ───
const { addClient } = require('./utils/realtime');
app.get('/api/events', addClient);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Notifications stub (ไว้สำหรับ AuthContext ที่เรียก unread-count) ───
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`🚀 Attendance API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
