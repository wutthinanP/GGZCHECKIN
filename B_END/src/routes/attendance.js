const router = require('express').Router();
const pool = require('../db');
const { authenticate, authorize } = require('../middlewares/auth');
const { saveBase64Image } = require('../middlewares/upload');
const { broadcast } = require('../utils/realtime');

// ──────────────────────────────────────────────
// Helper: Get today's date string in YYYY-MM-DD
// ──────────────────────────────────────────────
const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// ──────────────────────────────────────────────
// Helper: Find or create today's attendance record
// ──────────────────────────────────────────────
const getOrCreateAttendance = async (userId, workDate) => {
  let { rows } = await pool.query(
    `SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2`,
    [userId, workDate]
  );

  if (rows.length === 0) {
    const result = await pool.query(
      `INSERT INTO attendance (user_id, work_date) VALUES ($1, $2) RETURNING *`,
      [userId, workDate]
    );
    return result.rows[0];
  }
  return rows[0];
};

// ──────────────────────────────────────────────
// Helper: Calculate late minutes
// ──────────────────────────────────────────────
const calculateLateMinutes = (checkInTime, scheduleStartTime, gracePeriodMinutes) => {
  if (!scheduleStartTime) return 0;

  const now = new Date(checkInTime);
  const [startH, startM] = scheduleStartTime.split(':').map(Number);

  const scheduleStart = new Date(now);
  scheduleStart.setHours(startH, startM, 0, 0);

  // Add grace period
  const graceEnd = new Date(scheduleStart.getTime() + gracePeriodMinutes * 60000);

  if (now <= graceEnd) return 0;

  return Math.ceil((now - scheduleStart) / 60000);
};

// ──────────────────────────────────────────────
// Helper: Calculate worked minutes
// ──────────────────────────────────────────────
const calculateWorkedMinutes = (checkInAt, checkOutAt) => {
  if (!checkInAt || !checkOutAt) return 0;
  const diff = new Date(checkOutAt) - new Date(checkInAt);
  return Math.max(0, Math.floor(diff / 60000));
};

// ──────────────────────────────────────────────
// Helper: Calculate OT minutes
// ──────────────────────────────────────────────
const calculateOtMinutes = (checkOutAt, schedule) => {
  if (!checkOutAt || !schedule || !schedule.overtime_enabled) return 0;

  const out = new Date(checkOutAt);
  const otStart = schedule.overtime_start_time || schedule.end_time;
  if (!otStart) return 0;

  const [otH, otM] = otStart.split(':').map(Number);
  const otTime = new Date(out);
  otTime.setHours(otH, otM, 0, 0);

  if (out <= otTime) return 0;

  let otMins = Math.floor((out - otTime) / 60000);

  // Apply minimum
  if (otMins < schedule.minimum_overtime_minutes) return 0;

  // Apply rounding
  const rounding = schedule.overtime_rounding_minutes || 1;
  otMins = Math.floor(otMins / rounding) * rounding;

  return otMins;
};

// ──────────────────────────────────────────────
// Helper: Determine location type (WFH check)
// ──────────────────────────────────────────────
const getLocationType = async (userId, date) => {
  const { rows } = await pool.query(
    `SELECT id FROM wfh_requests
     WHERE user_id = $1 AND status = 'approved'
       AND start_date <= $2 AND end_date >= $2`,
    [userId, date]
  );
  return rows.length > 0 ? 'wfh' : 'office';
};

// ══════════════════════════════════════════════
// POST /api/attendance/check-in
// ══════════════════════════════════════════════
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, selfie } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const workDate = getTodayDate();

    // Get or create attendance
    const attendance = await getOrCreateAttendance(userId, workDate);

    if (attendance.check_in_at) {
      return res.status(400).json({ error: 'คุณ Check-in วันนี้แล้ว' });
    }

    // Save selfie
    const selfieUrl = selfie ? saveBase64Image(selfie) : null;

    // Get user schedule for late calculation
    const { rows: schedRows } = await pool.query(
      `SELECT ws.* FROM work_schedules ws
       JOIN users u ON u.schedule_id = ws.id
       WHERE u.id = $1`,
      [userId]
    );
    const schedule = schedRows[0] || null;

    const lateMinutes = schedule
      ? calculateLateMinutes(now, schedule.start_time, schedule.grace_period_minutes)
      : 0;

    const status = lateMinutes > 0 ? 'late' : 'present';
    const locationType = await getLocationType(userId, workDate);
    const finalStatus = locationType === 'wfh' ? 'wfh' : status;

    // Update attendance record
    await pool.query(
      `UPDATE attendance SET
        check_in_at = $1,
        check_in_latitude = $2, check_in_longitude = $3, check_in_accuracy = $4,
        check_in_selfie = $5,
        late_minutes = $6, status = $7
       WHERE id = $8`,
      [now, latitude || null, longitude || null, accuracy || null,
       selfieUrl, lateMinutes, finalStatus, attendance.id]
    );

    // Create attendance event
    await pool.query(
      `INSERT INTO attendance_events (attendance_id, user_id, event_type, event_at, latitude, longitude, accuracy, selfie, ip_address, user_agent)
       VALUES ($1, $2, 'check_in', $3, $4, $5, $6, $7, $8, $9)`,
      [attendance.id, userId, now, latitude || null, longitude || null, accuracy || null,
       selfieUrl, req.ip, req.headers['user-agent']]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'check_in', 'Check-in สำเร็จ', $2)`,
      [userId, `Check-in เวลา ${now.toLocaleTimeString('th-TH')}${lateMinutes > 0 ? ` (สาย ${lateMinutes} นาที)` : ''}`]
    );

    // Broadcast Realtime Update
    broadcast('ATTENDANCE_UPDATE', { type: 'check_in', userId, status: finalStatus });
    broadcast('NOTIFICATION_UPDATE', { userId });

    res.json({
      message: 'Check-in สำเร็จ',
      data: {
        attendanceId: attendance.id,
        checkInAt: now,
        lateMinutes,
        status: finalStatus,
        selfieUrl,
      },
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// POST /api/attendance/check-out
// ══════════════════════════════════════════════
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, selfie } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const workDate = getTodayDate();

    const { rows } = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2`,
      [userId, workDate]
    );

    if (rows.length === 0 || !rows[0].check_in_at) {
      return res.status(400).json({ error: 'กรุณา Check-in ก่อน' });
    }

    const attendance = rows[0];
    if (attendance.check_out_at) {
      return res.status(400).json({ error: 'คุณ Check-out วันนี้แล้ว' });
    }

    const selfieUrl = selfie ? saveBase64Image(selfie) : null;

    // Get schedule for OT calc
    const { rows: schedRows } = await pool.query(
      `SELECT ws.* FROM work_schedules ws
       JOIN users u ON u.schedule_id = ws.id WHERE u.id = $1`,
      [userId]
    );
    const schedule = schedRows[0] || null;

    const workedMinutes = calculateWorkedMinutes(attendance.check_in_at, now);
    const overtimeMinutes = schedule ? calculateOtMinutes(now, schedule) : 0;

    await pool.query(
      `UPDATE attendance SET
        check_out_at = $1,
        check_out_latitude = $2, check_out_longitude = $3, check_out_accuracy = $4,
        check_out_selfie = $5,
        worked_minutes = $6, overtime_minutes = $7
       WHERE id = $8`,
      [now, latitude || null, longitude || null, accuracy || null,
       selfieUrl, workedMinutes, overtimeMinutes, attendance.id]
    );

    await pool.query(
      `INSERT INTO attendance_events (attendance_id, user_id, event_type, event_at, latitude, longitude, accuracy, selfie, ip_address, user_agent)
       VALUES ($1, $2, 'check_out', $3, $4, $5, $6, $7, $8, $9)`,
      [attendance.id, userId, now, latitude || null, longitude || null, accuracy || null,
       selfieUrl, req.ip, req.headers['user-agent']]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'check_out', 'Check-out สำเร็จ', $2)`,
      [userId, `Check-out เวลา ${now.toLocaleTimeString('th-TH')} ทำงาน ${Math.floor(workedMinutes / 60)} ชม. ${workedMinutes % 60} นาที${overtimeMinutes > 0 ? ` OT ${Math.floor(overtimeMinutes / 60)} ชม. ${overtimeMinutes % 60} นาที` : ''}`]
    );

    // Broadcast Realtime Update
    broadcast('ATTENDANCE_UPDATE', { type: 'check_out', userId });
    broadcast('NOTIFICATION_UPDATE', { userId });

    res.json({
      message: 'Check-out สำเร็จ',
      data: {
        attendanceId: attendance.id,
        checkOutAt: now,
        workedMinutes,
        overtimeMinutes,
        selfieUrl,
      },
    });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// POST /api/attendance/break-start
// ══════════════════════════════════════════════
router.post('/break-start', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const workDate = getTodayDate();

    const { rows } = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2`,
      [userId, workDate]
    );

    if (rows.length === 0 || !rows[0].check_in_at) {
      return res.status(400).json({ error: 'กรุณา Check-in ก่อน' });
    }

    await pool.query(
      `INSERT INTO attendance_events (attendance_id, user_id, event_type, event_at, ip_address, user_agent)
       VALUES ($1, $2, 'break_start', $3, $4, $5)`,
      [rows[0].id, userId, now, req.ip, req.headers['user-agent']]
    );

    broadcast('ATTENDANCE_UPDATE', { type: 'break_start', userId });

    res.json({ message: 'เริ่มพักแล้ว', breakStartAt: now });
  } catch (err) {
    console.error('Break start error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// POST /api/attendance/break-end
// ══════════════════════════════════════════════
router.post('/break-end', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const workDate = getTodayDate();

    const { rows } = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2`,
      [userId, workDate]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'ไม่พบข้อมูล' });
    }

    await pool.query(
      `INSERT INTO attendance_events (attendance_id, user_id, event_type, event_at, ip_address, user_agent)
       VALUES ($1, $2, 'break_end', $3, $4, $5)`,
      [rows[0].id, userId, now, req.ip, req.headers['user-agent']]
    );

    broadcast('ATTENDANCE_UPDATE', { type: 'break_end', userId });

    res.json({ message: 'กลับจากพักแล้ว', breakEndAt: now });
  } catch (err) {
    console.error('Break end error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// GET /api/attendance/my/today — Employee's today attendance
// ══════════════════════════════════════════════
router.get('/my/today', authenticate, async (req, res) => {
  try {
    const workDate = getTodayDate();

    const { rows: attRows } = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2`,
      [req.user.id, workDate]
    );

    let att = attRows[0] || null;

    // Check if on approved leave today if no attendance record exists or not marked
    if (!att || att.status === 'not_checked_in') {
      const { rows: leaveCheck } = await pool.query(
        `SELECT lr.*, lt.name as leave_type_name
         FROM leave_requests lr
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE lr.user_id = $1 AND lr.status = 'approved'
           AND lr.start_date <= $2 AND lr.end_date >= $2
         LIMIT 1`,
        [req.user.id, workDate]
      );
      if (leaveCheck.length > 0) {
        if (!att) {
          att = {
            id: null,
            user_id: req.user.id,
            work_date: workDate,
            status: 'leave',
            leave_info: leaveCheck[0],
          };
        } else {
          att.status = 'leave';
          att.leave_info = leaveCheck[0];
        }
      }
    }

    const { rows: events } = await pool.query(
      `SELECT * FROM attendance_events
       WHERE user_id = $1 AND attendance_id IN (
         SELECT id FROM attendance WHERE user_id = $1 AND work_date = $2
       )
       ORDER BY event_at ASC`,
      [req.user.id, workDate]
    );

    res.json({
      attendance: att,
      events,
    });
  } catch (err) {
    console.error('Get today error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// GET /api/attendance/my/history — Employee's attendance history
// ══════════════════════════════════════════════
router.get('/my/history', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 31 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT * FROM attendance WHERE user_id = $1`;
    const params = [req.user.id];
    let paramIdx = 2;

    if (startDate) {
      query += ` AND work_date >= $${paramIdx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND work_date <= $${paramIdx++}`;
      params.push(endDate);
    }

    query += ` ORDER BY work_date DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// GET /api/attendance/employee/:userId — Admin view employee history
// ══════════════════════════════════════════════
router.get('/employee/:userId', authenticate, authorize('manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const targetUserId = parseInt(req.params.userId);

    let query = `SELECT a.*, u.first_name, u.last_name, u.employee_code
                 FROM attendance a
                 JOIN users u ON a.user_id = u.id
                 WHERE a.user_id = $1`;
    const params = [targetUserId];
    let paramIdx = 2;

    if (startDate) {
      query += ` AND a.work_date >= $${paramIdx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND a.work_date <= $${paramIdx++}`;
      params.push(endDate);
    }

    query += ` ORDER BY a.work_date DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get employee attendance error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// GET /api/attendance/daily/:date — All employees for a date (Admin)
// ══════════════════════════════════════════════
router.get('/daily/:date', authenticate, authorize('manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const workDate = req.params.date;

    const { rows } = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.employee_code, u.department, u.avatar,
              r.name as role_name,
              COALESCE(
                a.status,
                CASE WHEN EXISTS (
                  SELECT 1 FROM leave_requests lr 
                  WHERE lr.user_id = u.id AND lr.status = 'approved' 
                    AND lr.start_date <= $1 AND lr.end_date >= $1
                ) THEN 'leave' ELSE 'not_checked_in' END
              ) as status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN attendance a ON a.user_id = u.id AND a.work_date = $1
       WHERE u.status = 'active'
       ORDER BY u.first_name ASC`,
      [workDate]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get daily attendance error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ══════════════════════════════════════════════
// GET /api/attendance/events/:attendanceId — Get events for an attendance record
// ══════════════════════════════════════════════
router.get('/events/:attendanceId', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM attendance_events WHERE attendance_id = $1 ORDER BY event_at ASC`,
      [parseInt(req.params.attendanceId)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
