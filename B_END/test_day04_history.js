/**
 * Automated Verification Test Suite for Day 04
 * Focus: Employee Attendance History & Date Filter Verification
 * 
 * Objectives:
 * 1. Security / Authentication:
 *    - Case 1: GET /api/attendance/my/history without Token -> 401 Unauthorized
 *    - Case 2: GET /api/attendance/my/history with Invalid Token -> 401 Unauthorized
 * 2. Data Retrieval & Sorting:
 *    - Case 3: GET /api/attendance/my/history with valid Token -> 200 OK, sorted DESC by work_date
 * 3. Date Filtering:
 *    - Case 4: Filter by date range (startDate & endDate) -> Returns only records in range
 *    - Case 5: Filter by single date (startDate === endDate) -> Returns exactly 1 day record
 *    - Case 6: Filter with out-of-bounds dates -> Returns empty array []
 *    - Case 7: Pagination limit & page parameter -> Respects limit
 * 4. Data Isolation (Multi-tenant Privacy):
 *    - Case 8: Employee 1 and Employee 2 only receive their own history records
 * 5. Lifecycle Verification:
 *    - Case 9: Check-in verification reflects in history
 * 
 * Run: node test_day04_history.js
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
        timeout: 6000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
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

async function runHistoryTestSuite() {
  console.log('====================================================');
  console.log('📋 DAY 04 ATTENDANCE HISTORY & FILTER TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 9;

  // 1. Authenticate users
  console.log('--- 🔑 Authenticating Test Users ---');
  const loginRes1 = await request('/api/auth/login', 'POST', {
    email: 'employee1@company.com',
    password: 'password123',
  });
  let token1 = loginRes1.body?.accessToken;
  if (!token1) {
    const retry = await request('/api/auth/login', 'POST', {
      email: 'employee1@company.com',
      password: '123456',
    });
    token1 = retry.body?.accessToken;
  }
  console.log(`Employee 1 (employee1@company.com): Token ${maskToken(token1)}`);

  const loginRes2 = await request('/api/auth/login', 'POST', {
    email: 'employee2@company.com',
    password: '123456',
  });
  const token2 = loginRes2.body?.accessToken;
  console.log(`Employee 2 (employee2@company.com): Token ${maskToken(token2)}\n`);

  console.log('----------------------------------------------------');
  console.log('--- 🛡️ PART 1: Security & Negative Tests ---');

  // Case 1: No Token
  const c1 = await request('/api/attendance/my/history');
  if (c1.status === 401) {
    console.log('✅ [PASS] Case 1: เข้าถึง /my/history โดยไม่มี Token -> ปฏิเสธ 401 Unauthorized');
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 1: ได้รับ Status ${c1.status} (คาดหวัง 401)`);
  }

  // Case 2: Invalid Token
  const c2 = await request('/api/attendance/my/history', 'GET', null, 'invalid.bearer.token');
  if (c2.status === 401) {
    console.log('✅ [PASS] Case 2: เข้าถึง /my/history ด้วย Token ไม่ถูกต้อง -> ปฏิเสธ 401 Unauthorized');
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 2: ได้รับ Status ${c2.status} (คาดหวัง 401)`);
  }

  console.log('\n----------------------------------------------------');
  console.log('--- 📊 PART 2: History Data Retrieval & Sorting ---');

  // Case 3: History List & Sorting DESC
  const c3 = await request('/api/attendance/my/history', 'GET', null, token1);
  const records = Array.isArray(c3.body) ? c3.body : [];
  let isSorted = true;
  for (let i = 0; i < records.length - 1; i++) {
    if (new Date(records[i].work_date) < new Date(records[i + 1].work_date)) {
      isSorted = false;
      break;
    }
  }

  if (c3.status === 200 && records.length > 0 && isSorted) {
    console.log(`✅ [PASS] Case 3: ดึงรายการประวัติสำเร็จ (${records.length} รายการ) และเรียงลำดับ DESC ตามวันที่`);
    console.log(`   ตัวอย่าง: วันที่ ${records[0].work_date.substring(0, 10)} | สถานะ: ${records[0].status} | เข้า: ${records[0].check_in_at ? records[0].check_in_at.substring(11, 16) : '-'} | ออก: ${records[0].check_out_at ? records[0].check_out_at.substring(11, 16) : '-'}`);
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 3: status=${c3.status}, count=${records.length}, isSorted=${isSorted}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('--- 🔍 PART 3: Date Filtering Tests ---');

  // Case 4: Date Range Filter
  const c4 = await request('/api/attendance/my/history?startDate=2026-09-14&endDate=2026-09-16', 'GET', null, token1);
  const rangeRecords = Array.isArray(c4.body) ? c4.body : [];
  const inRange = rangeRecords.every((r) => {
    const d = r.work_date.substring(0, 10);
    return d >= '2026-09-14' && d <= '2026-09-16';
  });

  if (c4.status === 200 && rangeRecords.length > 0 && inRange) {
    console.log(`✅ [PASS] Case 4: กรองช่วงวันที่ (2026-09-14 ถึง 2026-09-16) ได้รับ ${rangeRecords.length} รายการ ข้อมูลตรงช่วงทุกรายการ`);
    rangeRecords.forEach((r) => console.log(`   - ${r.work_date.substring(0, 10)} : ${r.status}`));
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 4: status=${c4.status}, count=${rangeRecords.length}, inRange=${inRange}`);
  }

  // Case 5: Single Date Filter
  const c5 = await request('/api/attendance/my/history?startDate=2026-09-15&endDate=2026-09-15', 'GET', null, token1);
  const singleDayRecords = Array.isArray(c5.body) ? c5.body : [];
  if (c5.status === 200 && singleDayRecords.length === 1 && singleDayRecords[0].work_date.substring(0, 10) === '2026-09-15') {
    console.log('✅ [PASS] Case 5: กรองวันเดียว (2026-09-15) ได้รับผลลัพธ์ตรงเป๊ะ 1 รายการ');
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 5: status=${c5.status}, count=${singleDayRecords.length}`);
  }

  // Case 6: Out of Range Filter
  const c6 = await request('/api/attendance/my/history?startDate=2025-01-01&endDate=2025-01-31', 'GET', null, token1);
  if (c6.status === 200 && Array.isArray(c6.body) && c6.body.length === 0) {
    console.log('✅ [PASS] Case 6: กรองช่วงวันที่ไม่มีข้อมูล (2025-01-01 ถึง 2025-01-31) -> คืนค่า Array ว่าง []');
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 6: status=${c6.status}, body=${JSON.stringify(c6.body)}`);
  }

  // Case 7: Pagination Limit
  const c7 = await request('/api/attendance/my/history?limit=2&page=1', 'GET', null, token1);
  if (c7.status === 200 && Array.isArray(c7.body) && c7.body.length === 2) {
    console.log('✅ [PASS] Case 7: การตัดแบ่งหน้า Pagination (limit=2) -> คืนค่าตาม limit ถูกต้อง (2 รายการ)');
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 7: status=${c7.status}, length=${c7.body?.length}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('--- 🔒 PART 4: Data Isolation (Multi-tenant Privacy) ---');

  // Case 8: Isolation
  const c8_user1 = await request('/api/attendance/my/history', 'GET', null, token1);
  const c8_user2 = await request('/api/attendance/my/history', 'GET', null, token2);
  const u1_records = Array.isArray(c8_user1.body) ? c8_user1.body : [];
  const u2_records = Array.isArray(c8_user2.body) ? c8_user2.body : [];

  const u1_valid = u1_records.every((r) => String(r.user_id) === '4');
  const u2_valid = u2_records.every((r) => String(r.user_id) === '5');

  if (c8_user1.status === 200 && c8_user2.status === 200 && u1_valid && u2_valid) {
    console.log('✅ [PASS] Case 8: Data Isolation สมบูรณ์ พนักงานแต่ละคนเห็นเฉพาะข้อมูลประวัติของตนเอง');
    console.log(`   - Employee 1 (ID: 4): ${u1_records.length} รายการ (user_id = 4 ทั้งหมด)`);
    console.log(`   - Employee 2 (ID: 5): ${u2_records.length} รายการ (user_id = 5 ทั้งหมด)`);
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 8: u1_valid=${u1_valid}, u2_valid=${u2_valid}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('--- 🔄 PART 5: Realtime Attendance Entry & History Sync ---');

  // Case 9: Check-in and confirm in history
  const todayStr = new Date().toISOString().substring(0, 10);
  const checkinRes = await request('/api/attendance/check-in', 'POST', {
    latitude: 13.7563,
    longitude: 100.5018,
    accuracy: 10,
    selfie: 'data:image/jpeg;base64,/9j/testSelfieImageData',
  }, token1);

  const c9 = await request('/api/attendance/my/history?limit=1', 'GET', null, token1);
  const latestRecord = Array.isArray(c9.body) && c9.body.length > 0 ? c9.body[0] : null;

  if (latestRecord && latestRecord.work_date.substring(0, 10) === todayStr) {
    console.log('✅ [PASS] Case 9: เช็กอินปัจจุบันแล้ว ข้อมูลสะท้อนขึ้นมาเป็นรายการล่าสุดในหน้าประวัติทันที');
    console.log(`   รายการล่าสุด: ${latestRecord.work_date.substring(0, 10)} | สถานะ: ${latestRecord.status} | เช็กอิน: ${latestRecord.check_in_at}`);
    passed++;
  } else {
    console.log(`❌ [FAIL] Case 9: checkinRes=${checkinRes.status}, latestRecord=${JSON.stringify(latestRecord)}`);
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS SUMMARY: ${passed} / ${total} TESTS PASSED`);
  if (passed === total) {
    console.log('🎉 ALL DAY 04 ATTENDANCE HISTORY TESTS PASSED WITH 100% SUCCESS!');
  } else {
    console.log(`⚠️ Passed ${passed}/${total} tests.`);
  }
  console.log('====================================================\n');
}

runHistoryTestSuite().catch(console.error);
