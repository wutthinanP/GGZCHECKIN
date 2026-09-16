# 📋 รายงานผลการทดสอบ Day 02 — Authorization & E2E Runtime Evidence

เอกสารนี้รวบรวมหลักฐานการทดสอบจริง (Runtime Evidence) สำหรับการปิด Day 02 ของระบบ Online Attendance Check-in

---

## 1. 🔒 Negative Authorization Test

### วัตถุประสงค์
ป้องกันไม่ให้ผู้ใช้ทั่วไป (Role: `employee`) สามารถเปิดดูข้อมูล `attendance_events` (ซึ่งมีข้อมูลอ่อนไหว เช่น GPS, รูป Selfie, IP Address) ของผู้อื่นได้ โดยหากไม่มีสิทธิ์ ระบบต้องตอบกลับด้วย **`403 Forbidden`**

### รายละเอียดการทดสอบ
- **User A (Attacker/Tester):** `employee1@company.com` (Role: `employee`, ID: 4)
- **User B (Target Victim):** `employee2@company.com` (Role: `employee`, ID: 5, มี record `attendance_id` = 5)
- **Method & Endpoint:** `GET /api/attendance/events/5` ด้วย Token ของ User A

### ผลลัพธ์จริง (Actual Result)
- **HTTP Status:** `403 Forbidden`
- **Response Body:**
```json
{
  "error": "คุณไม่มีสิทธิ์เข้าถึงข้อมูล attendance ของผู้ใช้อื่น"
}
```

### ผลการทดสอบกรณีมีสิทธิ์ (Positive Authorization Tests)
1. **User A เข้าถึงข้อมูลของตัวเอง (`attendance_id = 4`):**
   - **HTTP Status:** `200 OK`
2. **Manager (`manager@company.com`, Role: `manager`) เข้าถึงข้อมูลของพนักงาน User B (`attendance_id = 5`):**
   - **HTTP Status:** `200 OK`

---

## 2. 🔄 E2E Runtime Flow Evidence

### วัตถุประสงค์
ยืนยันโฟลว์การทำงานจริงตั้งแต่ต้นจนจบ (End-to-End):
`Login` ➔ `Check-in` ➔ `GET /api/attendance/my/today (เช็กสถานะ)` ➔ `Check-out`

### ขั้นตอนและผลการรันจริง
- **ผู้ใช้ทดสอบ:** `employee5@company.com`

| ลำดับ | ขั้นตอน | Method & Path | HTTP Status | ผลลัพธ์ / ข้อมูลสำคัญ |
|:---:|---|---|:---:|---|
| **1** | Login | `POST /api/auth/login` | **200 OK** | ได้รับ JWT Access Token (`eyJhbGci...`) |
| **2** | Check-in | `POST /api/attendance/check-in` | **200 OK** | บันทึกเวลาเข้างาน พร้อมพิกัด GPS และรูปถ่าย Selfie |
| **3** | ดูสถานะวันนี้ | `GET /api/attendance/my/today` | **200 OK** | สถานะอัปเดตเป็น Present พร้อมเวลา `check_in_at` |
| **4** | Check-out | `POST /api/attendance/check-out` | **200 OK** | บันทึกเวลาออกงาน พร้อมคำนวณเวลาทำงาน |
| **5** | ตรวจสอบสถานะสมบูรณ์ | `GET /api/attendance/my/today` | **200 OK** | บันทึกทั้ง `check_in_at` และ `check_out_at` ครบถ้วน |

---

## 3. 🖥️ บันทึก Terminal Log จาก Test Script (`node B_END/test_day02.js`)

```text
====================================================
DAY 02 VERIFICATION TEST SUITE
====================================================

--- PART 1: Negative Authorization Test ---
[PASS] Logged in as User A: employee1@company.com (ID: 4, Role: employee)
[PASS] Logged in as User B: employee2@company.com (ID: 5, Role: employee)

Testing: User A (employee) requests GET /api/attendance/events/5 (User B's record)
Expected Status: 403 Forbidden
Actual Status:   403
Response Body:   { error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูล attendance ของผู้ใช้อื่น' }
[PASSED] Negative Authorization Test Succeeded! (403 Forbidden properly returned)

--- PART 2: Positive Authorization Test ---
User A requests own events (attendanceId=4): Status 200
Manager requests User B's events (attendanceId=5): Status 200

--- PART 3: E2E Runtime Evidence Flow ---
Step 1: Login successful for employee5@company.com
Step 2: Check-in response -> Status: 200, Message: "Check-in สำเร็จ"
Step 3: GET /my/today -> Check-in time: 2026-09-16T11:21:29.408Z
Step 4: Check-out response -> Status: 200, Message: "Check-out สำเร็จ"
Step 5: Final status -> Check-in: 2026-09-16T11:21:29.408Z, Check-out: 2026-09-16T11:21:29.443Z

====================================================
ALL DAY 02 TESTS COMPLETED SUCCESSFULLY
====================================================
```
