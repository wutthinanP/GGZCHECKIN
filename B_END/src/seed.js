/**
 * Seed Script — Populates the database with test data
 * Run: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ─── 1. Create Work Schedule ───
    console.log('📅 Creating work schedules...');
    const { rows: schedules } = await pool.query(
      `INSERT INTO work_schedules (name, start_time, end_time, grace_period_minutes, overtime_enabled, overtime_start_time, minimum_overtime_minutes, overtime_rounding_minutes)
       VALUES
         ('กะปกติ', '09:00', '18:00', 5, TRUE, '18:00', 30, 15),
         ('กะเช้า', '06:00', '15:00', 5, TRUE, '15:00', 30, 15),
         ('กะบ่าย', '14:00', '23:00', 5, TRUE, '23:00', 30, 15)
       ON CONFLICT DO NOTHING
       RETURNING *`
    );
    console.log(`   ✅ Created ${schedules.length} schedules`);

    // Get the default schedule id
    const { rows: defaultSched } = await pool.query(
      `SELECT id FROM work_schedules WHERE name = 'กะปกติ' LIMIT 1`
    );
    const defaultScheduleId = defaultSched.length > 0 ? defaultSched[0].id : null;

    // ─── 2. Create Schedule Breaks ───
    if (defaultScheduleId) {
      console.log('🍜 Creating schedule breaks...');
      await pool.query(
        `INSERT INTO schedule_breaks (schedule_id, name, start_time, end_time, is_paid)
         VALUES ($1, 'พักกลางวัน', '12:00', '13:00', FALSE)
         ON CONFLICT DO NOTHING`,
        [defaultScheduleId]
      );
      console.log('   ✅ Created lunch break for default schedule');
    }

    // ─── 3. Get Role IDs ───
    const { rows: roles } = await pool.query(`SELECT * FROM roles`);
    const roleMap = {};
    roles.forEach((r) => (roleMap[r.name] = r.id));
    console.log(`\n👤 Roles: ${roles.map((r) => `${r.name}(${r.id})`).join(', ')}`);

    // ─── 4. Create Users ───
    console.log('\n👥 Creating users...');
    const password = await bcrypt.hash('123456', 12);

    const users = [
      { code: 'SA001', first: 'Super', last: 'Admin', email: 'superadmin@company.com', role: 'super_admin', dept: 'IT', pos: 'System Administrator' },
      { code: 'AD001', first: 'สมชาย', last: 'ผู้ดูแล', email: 'admin@company.com', role: 'admin', dept: 'HR', pos: 'HR Manager' },
      { code: 'MG001', first: 'สมหญิง', last: 'หัวหน้า', email: 'manager@company.com', role: 'manager', dept: 'Engineering', pos: 'Team Lead' },
      { code: 'EMP001', first: 'สมศักดิ์', last: 'พนักงาน', email: 'employee1@company.com', role: 'employee', dept: 'Engineering', pos: 'Developer' },
      { code: 'EMP002', first: 'สมใจ', last: 'ทำงาน', email: 'employee2@company.com', role: 'employee', dept: 'Engineering', pos: 'Developer' },
      { code: 'EMP003', first: 'วิชัย', last: 'รักงาน', email: 'employee3@company.com', role: 'employee', dept: 'Design', pos: 'UI Designer' },
      { code: 'EMP004', first: 'พิมพ์ใจ', last: 'สุขใจ', email: 'employee4@company.com', role: 'employee', dept: 'Marketing', pos: 'Marketing Specialist' },
      { code: 'EMP005', first: 'ธนพล', last: 'มั่นคง', email: 'employee5@company.com', role: 'employee', dept: 'Finance', pos: 'Accountant' },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, schedule_id, department, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING`,
        [u.code, u.first, u.last, u.email, password, roleMap[u.role], defaultScheduleId, u.dept, u.pos]
      );
    }
    console.log(`   ✅ Created ${users.length} users (password: 123456)`);

    // ─── 5. Create sample attendance records ───
    console.log('\n📋 Creating sample attendance records...');
    const { rows: allUsers } = await pool.query(`SELECT id FROM users WHERE status = 'active' ORDER BY id`);

    // Create attendance for the past 5 work days
    const today = new Date();
    for (let d = 5; d >= 1; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const workDate = date.toISOString().split('T')[0];

      for (const user of allUsers) {
        // Random status
        const rand = Math.random();
        let status, lateMinutes = 0, checkInAt = null, checkOutAt = null, workedMins = 0, otMins = 0;

        if (rand < 0.7) {
          // Present on time
          status = 'present';
          const inH = 8 + Math.floor(Math.random() * 1); // 8:00-8:59
          const inM = Math.floor(Math.random() * 60);
          checkInAt = new Date(date);
          checkInAt.setHours(inH, inM, 0, 0);

          const outH = 18 + Math.floor(Math.random() * 2); // 18:00-19:59
          const outM = Math.floor(Math.random() * 60);
          checkOutAt = new Date(date);
          checkOutAt.setHours(outH, outM, 0, 0);

          workedMins = Math.floor((checkOutAt - checkInAt) / 60000);
          if (outH >= 19) otMins = (outH - 18) * 60 + outM;
        } else if (rand < 0.85) {
          // Late
          status = 'late';
          const inH = 9;
          const inM = 6 + Math.floor(Math.random() * 30); // 09:06-09:35
          checkInAt = new Date(date);
          checkInAt.setHours(inH, inM, 0, 0);
          lateMinutes = inM - 5; // After 09:05 grace

          checkOutAt = new Date(date);
          checkOutAt.setHours(18, Math.floor(Math.random() * 30), 0, 0);

          workedMins = Math.floor((checkOutAt - checkInAt) / 60000);
        } else if (rand < 0.9) {
          // WFH
          status = 'wfh';
          checkInAt = new Date(date);
          checkInAt.setHours(9, Math.floor(Math.random() * 5), 0, 0);
          checkOutAt = new Date(date);
          checkOutAt.setHours(18, Math.floor(Math.random() * 30), 0, 0);
          workedMins = Math.floor((checkOutAt - checkInAt) / 60000);
        } else {
          // Absent or leave
          status = Math.random() < 0.5 ? 'absent' : 'leave';
        }

        await pool.query(
          `INSERT INTO attendance (user_id, work_date, check_in_at, check_out_at, late_minutes, worked_minutes, overtime_minutes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id, work_date) DO NOTHING`,
          [user.id, workDate, checkInAt, checkOutAt, lateMinutes, workedMins, otMins, status]
        );
      }
    }
    console.log('   ✅ Created attendance records for past 5 work days');

    // ─── 6. Create sample leave types (already in schema via INSERT) ───
    console.log('\n✅ Leave types already created via schema');

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Seed completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📧 Test Accounts (password: 123456):');
    console.log('   Super Admin : superadmin@company.com');
    console.log('   Admin       : admin@company.com');
    console.log('   Manager     : manager@company.com');
    console.log('   Employee    : employee1@company.com');
    console.log('   Employee    : employee2@company.com');
    console.log('═══════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
