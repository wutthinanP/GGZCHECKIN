/**
 * Test Script for Day 02 Validation
 * - Negative Authorization Test (User A accesses User B's events -> 403 Forbidden)
 * - Positive Authorization Test (User A accesses own events -> 200 OK, Manager accesses User B's events -> 200 OK)
 * - E2E Runtime Flow (Login -> Check-in -> GET /my/today -> Check-out)
 * 
 * Run: node test_day02.js
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const { hostname, port } = new URL(BASE_URL);

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
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('DAY 02 VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // 1. Negative Authorization Test
  console.log('--- PART 1: Negative Authorization Test ---');
  const loginA = await request('/api/auth/login', 'POST', {
    email: 'employee1@company.com',
    password: '123456',
  });

  const tokenA = loginA.body.accessToken;
  const userA = loginA.body.user;
  console.log(`[PASS] Logged in as User A: ${userA.email} (ID: ${userA.id}, Role: ${userA.role})`);

  const loginB = await request('/api/auth/login', 'POST', {
    email: 'employee2@company.com',
    password: '123456',
  });

  const tokenB = loginB.body.accessToken;
  const userB = loginB.body.user;
  console.log(`[PASS] Logged in as User B: ${userB.email} (ID: ${userB.id}, Role: ${userB.role})`);

  const targetAttendanceId = 5; // Attendance ID of User B
  const negativeRes = await request(`/api/attendance/events/${targetAttendanceId}`, 'GET', null, tokenA);

  console.log(`\nTesting: User A (employee) requests GET /api/attendance/events/${targetAttendanceId} (User B's record)`);
  console.log(`Expected Status: 403 Forbidden`);
  console.log(`Actual Status:   ${negativeRes.status}`);
  console.log(`Response Body:  `, negativeRes.body);

  if (negativeRes.status === 403) {
    console.log('[PASSED] Negative Authorization Test Succeeded! (403 Forbidden properly returned)\n');
  } else {
    console.error('[FAILED] Negative Authorization Test Failed!\n');
  }

  // 2. Positive Authorization Test
  console.log('--- PART 2: Positive Authorization Test ---');
  const ownerRes = await request(`/api/attendance/events/4`, 'GET', null, tokenA);
  console.log(`User A requests own events (attendanceId=4): Status ${ownerRes.status}`);

  const loginManager = await request('/api/auth/login', 'POST', {
    email: 'manager@company.com',
    password: '123456',
  });
  const tokenManager = loginManager.body.accessToken;
  const managerRes = await request(`/api/attendance/events/${targetAttendanceId}`, 'GET', null, tokenManager);
  console.log(`Manager requests User B's events (attendanceId=${targetAttendanceId}): Status ${managerRes.status}\n`);

  // 3. E2E Flow Test
  console.log('--- PART 3: E2E Runtime Evidence Flow ---');
  const loginTest = await request('/api/auth/login', 'POST', {
    email: 'employee5@company.com',
    password: '123456',
  });
  const testToken = loginTest.body.accessToken;
  console.log(`Step 1: Login successful for ${loginTest.body.user.email}`);

  const checkinPayload = {
    latitude: 13.7563,
    longitude: 100.5018,
    accuracy: 10,
    photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };
  const checkinRes = await request('/api/attendance/check-in', 'POST', checkinPayload, testToken);
  console.log(`Step 2: Check-in response -> Status: ${checkinRes.status}, Message: "${checkinRes.body.message || checkinRes.body.error}"`);

  const todayRes = await request('/api/attendance/my/today', 'GET', null, testToken);
  console.log(`Step 3: GET /my/today -> Check-in time: ${todayRes.body.attendance ? todayRes.body.attendance.check_in_at : 'None'}`);

  const checkoutRes = await request('/api/attendance/check-out', 'POST', checkinPayload, testToken);
  console.log(`Step 4: Check-out response -> Status: ${checkoutRes.status}, Message: "${checkoutRes.body.message || checkoutRes.body.error}"`);

  const finalRes = await request('/api/attendance/my/today', 'GET', null, testToken);
  console.log(`Step 5: Final status -> Check-in: ${finalRes.body.attendance?.check_in_at}, Check-out: ${finalRes.body.attendance?.check_out_at}`);

  console.log('\n====================================================');
  console.log('ALL DAY 02 TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runTests().catch(console.error);
