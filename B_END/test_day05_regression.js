/**
 * ============================================================================
 * Day 05 — Final Regression & Authorization Automated Test Suite
 * ============================================================================
 * 
 * Objectives:
 * 1. E2E Flow: Login -> Check-in -> Check-out -> History
 * 2. Backdated Check-in Prevention: Explicit rejection of past dates
 * 3. Date Filter: Valid range, Single date, Invalid range (400), Empty result, Pagination
 * 4. Employee Data Isolation: Strict multi-tenant separation, IDOR protection
 * 5. Manager Permission Check: Backend RBAC enforcement (Manager 200 OK vs Employee 403 Forbidden)
 *    *Note: Manager/Admin UI is scheduled as Pending for Day 06+; Day 05 verifies backend RBAC security.
 * 
 * Run: node test_day05_regression.js
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const { hostname, port } = new URL(BASE_URL);

function maskToken(token) {
  if (!token || typeof token !== 'string') return '[REDACTED]';
  if (token.length <= 16) return '****';
  return token.substring(0, 10) + '...' + token.substring(token.length - 6) + ' [REDACTED]';
}

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: hostname || 'localhost',
        port: port || 3001,
        path,
        method,
        headers,
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data),
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data,
            });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password = '123456') {
  let res = await request('/api/auth/login', 'POST', { email, password });
  if (!res.body?.accessToken) {
    // Retry with alternate seed password if needed
    res = await request('/api/auth/login', 'POST', { email, password: 'password123' });
  }
  return res.body?.accessToken || null;
}

async function runRegressionTestSuite() {
  console.log('====================================================================');
  console.log('🏁 DAY 05: FINAL REGRESSION & AUTHORIZATION CHECK TEST SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function testCase(name, isPass, detail = '') {
    total++;
    if (isPass) {
      passed++;
      console.log(`✅ [PASS] Case ${total}: ${name}`);
      if (detail) console.log(`   ${detail}`);
    } else {
      console.log(`❌ [FAIL] Case ${total}: ${name}`);
      if (detail) console.log(`   [Detail]: ${detail}`);
    }
  }

  // 1. Authenticate users
  console.log('--- 🔑 Authenticating Test Accounts ---');
  const emp1Token = await login('employee1@company.com');
  const emp2Token = await login('employee2@company.com');
  const mgrToken = await login('manager@company.com');

  console.log(`Employee 1 (employee1@company.com): ${maskToken(emp1Token)}`);
  console.log(`Employee 2 (employee2@company.com): ${maskToken(emp2Token)}`);
  console.log(`Manager    (manager@company.com)  : ${maskToken(mgrToken)}\n`);

  if (!emp1Token || !emp2Token || !mgrToken) {
    console.error('❌ Authentication failed for one or more test accounts. Aborting.');
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────────────
  // PART 1: E2E Flow: Login -> Check-in -> Check-out -> History
  // ──────────────────────────────────────────────────────────────────
  console.log('--------------------------------------------------------------------');
  console.log('--- 📱 PART 1: E2E Lifecycle Flow (Check-in -> Check-out -> History) ---');

  // Employee 1 Check-in (if not already checked in today)
  const todayStr = new Date().toISOString().substring(0, 10);
  const checkinRes = await request(
    '/api/attendance/check-in',
    'POST',
    {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 12,
      selfie: 'data:image/jpeg;base64,/9j/4AAQSkZJRgEBAQAAAQABAAD/2wBDAAMCAg...',
    },
    emp1Token
  );
  const checkinSuccess =
    checkinRes.status === 200 ||
    (checkinRes.status === 400 && checkinRes.body?.error?.includes('คุณ Check-in วันนี้แล้ว'));

  testCase(
    'E2E Check-in: บันทึกเวลาเข้างานพร้อมพิกัด GPS & Selfie สำเร็จ',
    checkinSuccess,
    `Status: ${checkinRes.status} | Response: ${JSON.stringify(checkinRes.body?.message || checkinRes.body?.error)}`
  );

  // Employee 1 Check-out
  const checkoutRes = await request(
    '/api/attendance/check-out',
    'POST',
    {
      latitude: 13.7565,
      longitude: 100.5020,
      accuracy: 10,
      selfie: 'data:image/jpeg;base64,/9j/4AAQSkZJRgEBAQAAAQABAAD/2wBDAAMCAg...',
    },
    emp1Token
  );
  const checkoutSuccess =
    checkoutRes.status === 200 ||
    (checkoutRes.status === 400 && checkoutRes.body?.error?.includes('คุณ Check-out วันนี้แล้ว'));

  testCase(
    'E2E Check-out: บันทึกเวลาออกงาน คำนวณชั่วโมงทำงานและสะท้อนสถานะ',
    checkoutSuccess,
    `Status: ${checkoutRes.status} | Response: ${JSON.stringify(checkoutRes.body?.message || checkoutRes.body?.error)}`
  );

  // Check History reflects today's entry
  const histRes = await request('/api/attendance/my/history?limit=1', 'GET', null, emp1Token);
  const latest = Array.isArray(histRes.body) && histRes.body.length > 0 ? histRes.body[0] : null;
  const histSynced = latest && latest.work_date.substring(0, 10) === todayStr && latest.check_in_at !== null;

  testCase(
    'E2E History Sync: รายการเช็กอิน/ออกสะท้อนขึ้นหน้าประวัติของตนเองทันที',
    histSynced,
    `วันที่: ${latest?.work_date?.substring(0, 10)} | เข้า: ${latest?.check_in_at ? 'Yes' : 'No'} | ออก: ${latest?.check_out_at ? 'Yes' : '-'}`
  );

  // ──────────────────────────────────────────────────────────────────
  // PART 2: Backdated Check-in Prevention
  // ──────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------');
  console.log('--- 🛡️ PART 2: Backdated Check-in Prevention (Anti-Tampering) ---');

  // Attempt check-in with backdated 'work_date'
  const backdateRes1 = await request(
    '/api/attendance/check-in',
    'POST',
    {
      work_date: '2026-09-01',
      latitude: 13.7563,
      longitude: 100.5018,
    },
    emp2Token
  );

  testCase(
    'Backdated Check-in Rejection: ปฏิเสธเมื่อมีการส่ง work_date ย้อนหลัง (400 Bad Request)',
    backdateRes1.status === 400 && backdateRes1.body?.error?.includes('ไม่อนุญาตให้ Check-in ย้อนหลัง'),
    `Status: ${backdateRes1.status} | Error: "${backdateRes1.body?.error}"`
  );

  // Attempt check-in with backdated 'date' field
  const backdateRes2 = await request(
    '/api/attendance/check-in',
    'POST',
    {
      date: '2026-08-15',
      latitude: 13.7563,
      longitude: 100.5018,
    },
    emp2Token
  );

  testCase(
    'Backdated Date Field Rejection: ปฏิเสธ payload date ปลอมแปลงย้อนหลัง (400 Bad Request)',
    backdateRes2.status === 400 && backdateRes2.body?.error?.includes('ไม่อนุญาตให้ Check-in ย้อนหลัง'),
    `Status: ${backdateRes2.status} | Error: "${backdateRes2.body?.error}"`
  );

  // ──────────────────────────────────────────────────────────────────
  // PART 3: Date Filter, Invalid Range, Empty Result, Pagination
  // ──────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------');
  console.log('--- 🔍 PART 3: Date Filter, Invalid Range, Empty Result, Pagination ---');

  // Case 6: Valid Date Range Filter
  const filterValid = await request(
    '/api/attendance/my/history?startDate=2026-09-14&endDate=2026-09-16',
    'GET',
    null,
    emp1Token
  );
  const filterRecords = Array.isArray(filterValid.body) ? filterValid.body : [];
  const inRange =
    filterRecords.length > 0 &&
    filterRecords.every((r) => {
      const d = r.work_date.substring(0, 10);
      return d >= '2026-09-14' && d <= '2026-09-16';
    });

  testCase(
    'Date Range Filter: กรองช่วงวันที่ถูกต้อง (2026-09-14 ถึง 2026-09-16) ได้ข้อมูลตรงเป๊ะ',
    filterValid.status === 200 && inRange,
    `คืนค่า ${filterRecords.length} รายการ ตรงตามช่วงทุกรายการ`
  );

  // Case 7: Invalid Date Range (startDate > endDate)
  const invalidRange = await request(
    '/api/attendance/my/history?startDate=2026-09-20&endDate=2026-09-10',
    'GET',
    null,
    emp1Token
  );

  testCase(
    'Invalid Date Range Check: ส่ง startDate > endDate ปฏิเสธด้วย 400 Bad Request',
    invalidRange.status === 400 && invalidRange.body?.error?.includes('ช่วงวันที่ไม่ถูกต้อง'),
    `Status: ${invalidRange.status} | Error: "${invalidRange.body?.error}"`
  );

  // Case 8: Empty Result
  const emptyFilter = await request(
    '/api/attendance/my/history?startDate=2025-01-01&endDate=2025-01-31',
    'GET',
    null,
    emp1Token
  );

  testCase(
    'Empty Result: กรองช่วงวันที่ไม่มีประวัติ คืนค่า 200 OK พร้อม Array ว่าง []',
    emptyFilter.status === 200 && Array.isArray(emptyFilter.body) && emptyFilter.body.length === 0,
    `Status: ${emptyFilter.status} | Length: ${emptyFilter.body?.length}`
  );

  // Case 9: Pagination Limit and Offset (Page 1 vs Page 2)
  const page1 = await request('/api/attendance/my/history?limit=2&page=1', 'GET', null, emp1Token);
  const page2 = await request('/api/attendance/my/history?limit=2&page=2', 'GET', null, emp1Token);
  const p1Records = Array.isArray(page1.body) ? page1.body : [];
  const p2Records = Array.isArray(page2.body) ? page2.body : [];

  const distinctPages =
    p1Records.length > 0 &&
    p2Records.length > 0 &&
    p1Records[0].id !== p2Records[0].id &&
    p1Records[1]?.id !== p2Records[0]?.id;

  testCase(
    'Pagination Flow: แบ่งหน้า limit=2 & page=1 เทียบกับ page=2 ข้อมูลถูกต้องไม่ซ้ำซ้อน',
    page1.status === 200 && page2.status === 200 && distinctPages,
    `Page 1 ID: [${p1Records.map((r) => r.id).join(', ')}] | Page 2 ID: [${p2Records.map((r) => r.id).join(', ')}]`
  );

  // ──────────────────────────────────────────────────────────────────
  // PART 4: Employee Data Isolation (Multi-tenant Privacy & IDOR)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------');
  console.log('--- 🔒 PART 4: Employee Data Isolation (Privacy & IDOR Check) ---');

  // Employee 1 vs Employee 2 history isolation
  const u1History = await request('/api/attendance/my/history', 'GET', null, emp1Token);
  const u2History = await request('/api/attendance/my/history', 'GET', null, emp2Token);
  const u1Recs = Array.isArray(u1History.body) ? u1History.body : [];
  const u2Recs = Array.isArray(u2History.body) ? u2History.body : [];

  const isolationPass =
    u1Recs.length > 0 &&
    u2Recs.length > 0 &&
    u1Recs.every((r) => String(r.user_id) === '4') &&
    u2Recs.every((r) => String(r.user_id) === '5');

  testCase(
    'Employee Data Isolation: พนักงานแต่ละคนเห็นเฉพาะประวัติของตนเอง (user_id ตรงกัน 100%)',
    isolationPass,
    `Employee 1: ${u1Recs.length} รายการ (user_id=4) | Employee 2: ${u2Recs.length} รายการ (user_id=5)`
  );

  // IDOR Protection: Employee 1 attempts to access Employee 2's event record
  const u2FirstAttId = u2Recs[0]?.id;
  const idorRes = await request(
    `/api/attendance/events/${u2FirstAttId}`,
    'GET',
    null,
    emp1Token
  );

  testCase(
    'IDOR Protection: Employee 1 พยายามเข้าถึง Event ของ Employee 2 ถูกปฏิเสธ 403 Forbidden',
    idorRes.status === 403,
    `Target Att ID: ${u2FirstAttId} | Status: ${idorRes.status} | Error: "${idorRes.body?.error}"`
  );

  // ──────────────────────────────────────────────────────────────────
  // PART 5: Manager RBAC Permission Verification (Backend APIs)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------');
  console.log('--- 👔 PART 5: Manager Permission Verification (RBAC API Guard) ---');
  console.log('   *หมายเหตุ: Manager/Admin UI เป็นสถานะ Pending (จะพัฒนาในวันต่อไป)');
  console.log('   *การตรวจสอบในข้อนี้คือการยืนยันความถูกต้องของ RBAC ในระดับ Backend APIs:');

  // 5A. Employee forbidden from manager daily attendance API
  const empDaily = await request('/api/attendance/daily/2026-09-15', 'GET', null, emp1Token);
  testCase(
    'RBAC Guard: Employee เข้าถึง GET /api/attendance/daily/:date ถูกปฏิเสธ 403 Forbidden',
    empDaily.status === 403,
    `Status: ${empDaily.status} | Employee ไม่มีสิทธิ์เข้าถึงภาพรวมของพนักงานคนอื่น`
  );

  // 5B. Employee forbidden from viewing other employee history via Admin API
  const empOther = await request('/api/attendance/employee/5', 'GET', null, emp1Token);
  testCase(
    'RBAC Guard: Employee เข้าถึง GET /api/attendance/employee/:userId ถูกปฏิเสธ 403 Forbidden',
    empOther.status === 403,
    `Status: ${empOther.status} | Employee ไม่มีสิทธิ์เข้าถึงประวัติรายบุคคลของผู้อื่น`
  );

  // 5C. Manager allowed to view daily attendance summary
  const mgrDaily = await request('/api/attendance/daily/2026-09-15', 'GET', null, mgrToken);
  testCase(
    'Manager Access: Manager เข้าถึง GET /api/attendance/daily/:date ได้รับ 200 OK ตามสิทธิ์',
    mgrDaily.status === 200 && Array.isArray(mgrDaily.body),
    `Status: ${mgrDaily.body ? mgrDaily.status : mgrDaily.status} | คืนข้อมูลพนักงานทั้งแผนก ${mgrDaily.body?.length || 0} รายการ`
  );

  // 5D. Manager allowed to view employee individual history
  const mgrEmployeeHist = await request('/api/attendance/employee/4', 'GET', null, mgrToken);
  testCase(
    'Manager Access: Manager เข้าถึง GET /api/attendance/employee/:userId ได้รับ 200 OK ตามสิทธิ์',
    mgrEmployeeHist.status === 200 && Array.isArray(mgrEmployeeHist.body),
    `Status: ${mgrEmployeeHist.status} | เข้าดูประวัติ Employee 1 (ID: 4) ได้รับ ${mgrEmployeeHist.body?.length || 0} รายการ`
  );

  // 5E. Manager allowed to inspect employee attendance events (GPS / Selfie auditing)
  const mgrEvents = await request(`/api/attendance/events/${u2FirstAttId}`, 'GET', null, mgrToken);
  testCase(
    'Manager Auditing: Manager เข้าถึง GET /api/attendance/events/:attendanceId ได้รับ 200 OK เพื่อตรวจสอบ',
    mgrEvents.status === 200 && Array.isArray(mgrEvents.body),
    `Status: ${mgrEvents.status} | Manager ตรวจสอบ Event/พิกัดของ Employee 2 สำเร็จ`
  );

  // ──────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log(`🏁 TEST RESULTS SUMMARY: ${passed} / ${total} TESTS PASSED`);
  if (passed === total) {
    console.log('🎉 ALL DAY 05 REGRESSION & AUTHORIZATION TESTS PASSED WITH 100% SUCCESS!');
  } else {
    console.log(`⚠️ Passed ${passed}/${total} tests. Please review the failed cases above.`);
  }
  console.log('====================================================================\n');
}

runRegressionTestSuite().catch(console.error);
