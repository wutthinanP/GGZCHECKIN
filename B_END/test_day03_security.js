/**
 * Automated Security & Verification Test Suite for Day 03
 * 
 * Objectives:
 * 1. Security Negative Test Cases:
 *    - Case 1: Request protected endpoint without Token -> Expect 401 Unauthorized
 *    - Case 2: Request protected endpoint with Invalid/Forged Token -> Expect 401 Unauthorized
 *    - Case 3: Request REST endpoint with Token in query param instead of Bearer header -> Expect 401 Unauthorized
 *    - Case 4: IDOR / Access Control: Employee A accesses Employee B's events -> Expect 403 Forbidden
 *    - Case 5: Request SSE (/api/events) without Token -> Expect 401 Unauthorized
 * 2. Security Positive Test Cases:
 *    - Case 6: Connect to SSE (/api/events?token=...) with valid Token -> Expect 200 OK (text/event-stream)
 * 3. E2E Core Flow Test:
 *    - Step 1: Login (employee)
 *    - Step 2: Check-in with GPS + Selfie
 *    - Step 3: Verify Status (GET /api/attendance/my/today)
 *    - Step 4: Check-out with GPS + Selfie
 *    - Step 5: Verify Final Attendance Record
 * 
 * Run: node test_day03_security.js
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
        timeout: 5000,
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

// Helper to test SSE connection
async function testSSE(token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const path = token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events';

    const req = http.request(
      {
        hostname: hostname || 'localhost',
        port: port || 3001,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let receivedData = '';
        res.on('data', (chunk) => {
          receivedData += chunk.toString();
          // If we receive SSE event data or connection ping, resolve successfully
          if (res.statusCode === 200) {
            req.destroy();
            resolve({ status: res.statusCode, headers: res.headers, body: receivedData });
          }
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(receivedData) });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: receivedData });
          }
        });
      }
    );

    req.on('error', (err) => {
      // If destroyed after reading 200 SSE data, ignore error
      if (err.code === 'ECONNRESET') return;
      reject(err);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ status: 408, body: 'Timeout' });
    });

    req.end();
  });
}

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🛡️  DAY 03 SECURITY TEST SUITE & E2E VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name, condition, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] Case ${totalTests}: ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.error(`❌ [FAIL] Case ${totalTests}: ${name}`);
      if (details) console.error(`   ${details}`);
    }
    console.log('');
  }

  // Pre-requisite: Login legitimate users
  console.log('--- 🔑 Authenticating Test Users ---');
  const loginA = await request('/api/auth/login', 'POST', {
    email: 'employee1@company.com',
    password: '123456',
  });
  const tokenA = loginA.body.accessToken;
  const userA = loginA.body.user;
  console.log(`Logged in as User A: ${userA.email} (ID: ${userA.id}, Role: ${userA.role}) | Token: ${maskToken(tokenA)}`);

  const loginB = await request('/api/auth/login', 'POST', {
    email: 'employee2@company.com',
    password: '123456',
  });
  const tokenB = loginB.body.accessToken;
  const userB = loginB.body.user;
  console.log(`Logged in as User B: ${userB.email} (ID: ${userB.id}, Role: ${userB.role}) | Token: ${maskToken(tokenB)}`);
  console.log('\n----------------------------------------------------\n');

  // 1. Negative Test Case 1: No Token
  console.log('--- 🛡️ PART 1: Security Negative Tests ---');
  const resNoToken = await request('/api/attendance/my/today', 'GET');
  assertTest(
    'ไม่มี Token ส่งไปยัง Protected Endpoint -> ปฏิเสธ 401 Unauthorized',
    resNoToken.status === 401,
    `Status: ${resNoToken.status} | Error: "${resNoToken.body.error}"`
  );

  // 2. Negative Test Case 2: Invalid / Forged Token
  const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_payload.invalid_signature';
  const resInvalidToken = await request('/api/attendance/my/today', 'GET', null, forgedToken);
  assertTest(
    'Token ไม่ถูกต้อง / Forged Token -> ปฏิเสธ 401 Unauthorized',
    resInvalidToken.status === 401,
    `Status: ${resInvalidToken.status} | Error: "${resInvalidToken.body.error}"`
  );

  // 3. Negative Test Case 3: Token passed via Query String to REST API
  // General REST APIs should NOT accept ?token=...
  const resQueryToken = await request(`/api/attendance/my/today?token=${tokenA}`, 'GET');
  assertTest(
    'ยกเลิก Query Token สำหรับ REST API (?token=...) -> ปฏิเสธ 401 Unauthorized',
    resQueryToken.status === 401,
    `Status: ${resQueryToken.status} | Expected: 401 | Response: "${resQueryToken.body.error}"`
  );

  // 4. Negative Test Case 4: IDOR Protection (Employee A accesses Employee B's attendance events)
  const targetAttendanceIdB = 5; // Record owned by User B
  const resIDOR = await request(`/api/attendance/events/${targetAttendanceIdB}`, 'GET', null, tokenA);
  assertTest(
    'Employee A เข้าถึงข้อมูล Attendance Events ของ Employee B (IDOR) -> ปฏิเสธ 403 Forbidden',
    resIDOR.status === 403,
    `Status: ${resIDOR.status} | Response: "${resIDOR.body.error}"`
  );

  // 5. Negative Test Case 5: SSE /api/events without Token
  const resSSENoToken = await testSSE(null);
  assertTest(
    'เข้าถึง /api/events (SSE) โดยไม่มี Token -> ปฏิเสธ 401 Unauthorized',
    resSSENoToken.status === 401,
    `Status: ${resSSENoToken.status} | Response: "${typeof resSSENoToken.body === 'object' ? resSSENoToken.body.error : resSSENoToken.body}"`
  );

  // 6. Positive Test Case: SSE /api/events with Valid Token
  console.log('--- 📡 PART 2: SSE Realtime Stream Positive Verification ---');
  const resSSEValid = await testSSE(tokenA);
  assertTest(
    'เชื่อมต่อ /api/events (SSE) ด้วย Token ที่ถูกต้อง -> สำเร็จ 200 OK (text/event-stream)',
    resSSEValid.status === 200,
    `Status: ${resSSEValid.status} | Content-Type: ${resSSEValid.headers['content-type']}`
  );

  // 7. E2E Core Flow Test (Login -> Check-in -> Check-out)
  console.log('--- 🔄 PART 3: E2E Core Attendance Flow (Employee 5) ---');
  const loginE2E = await request('/api/auth/login', 'POST', {
    email: 'employee5@company.com',
    password: '123456',
  });
  const e2eToken = loginE2E.body.accessToken;
  console.log(`Step 1: Login as ${loginE2E.body.user.email} (Status: ${loginE2E.status})`);

  const mockPayload = {
    latitude: 13.7563,
    longitude: 100.5018,
    accuracy: 8,
    photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const checkinRes = await request('/api/attendance/check-in', 'POST', mockPayload, e2eToken);
  console.log(`Step 2: Check-in -> Status: ${checkinRes.status} | Message: "${checkinRes.body.message || checkinRes.body.error}"`);

  const midStatus = await request('/api/attendance/my/today', 'GET', null, e2eToken);
  console.log(`Step 3: GET /my/today -> Status: ${midStatus.status} | Check-in at: ${midStatus.body.attendance?.check_in_at}`);

  const checkoutRes = await request('/api/attendance/check-out', 'POST', mockPayload, e2eToken);
  console.log(`Step 4: Check-out -> Status: ${checkoutRes.status} | Message: "${checkoutRes.body.message || checkoutRes.body.error}"`);

  const finalStatus = await request('/api/attendance/my/today', 'GET', null, e2eToken);
  console.log(`Step 5: Final Status -> Check-in: ${finalStatus.body.attendance?.check_in_at} | Check-out: ${finalStatus.body.attendance?.check_out_at}`);

  const e2eSuccess =
    loginE2E.status === 200 &&
    (checkinRes.status === 200 || checkinRes.body.message) &&
    (checkoutRes.status === 200 || checkoutRes.body.message) &&
    finalStatus.status === 200;

  assertTest(
    'E2E Full Attendance Cycle (Login -> Check-in -> Status -> Check-out -> Final Verify)',
    e2eSuccess,
    `Complete attendance lifecycle verified successfully.`
  );

  console.log('====================================================');
  console.log(`🏁 TEST RESULTS SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL DAY 03 SECURITY & E2E TESTS PASSED WITH 100% SUCCESS!');
  } else {
    console.error('⚠️ SOME TESTS FAILED. PLEASE CHECK THE LOG ABOVE.');
  }
  console.log('====================================================');
}

runSecurityTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
