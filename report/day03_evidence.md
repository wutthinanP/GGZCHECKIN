# 🛡️ รายงานผลการทดสอบ Day 03 — Security Hardening, Negative Tests & E2E Evidence

เอกสารรวบรวมผลการแก้ไขความปลอดภัยและการทดสอบจริง (Runtime Evidence) สำหรับการปิดงาน **Day 03** ของระบบ Online Attendance Check-in

---

## 📌 สรุปการแก้ไขช่องโหว่ความปลอดภัย (Security Hardening)

| ข้อ | รายการ | รายละเอียดการแก้ไข | ไฟล์ที่เกี่ยวข้อง |
|:---:|---|---|---|
| **1** | **ปิดช่องโหว่ `/api/events` (SSE)** | ปรับปรุง Endpoint ไม่ให้เปิด Public โดยใช้ middleware `authenticateSSE` บังคับตรวจสอบ JWT ก่อนอนุญาตให้ client เปิดสตรีมเชื่อมต่อ หากไม่มี Token จะตอบกลับด้วย `401 Unauthorized` | [`B_END/src/index.js`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/B_END/src/index.js)<br>[`B_END/src/middlewares/auth.js`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/B_END/src/middlewares/auth.js) |
| **2** | **ยกเลิก / จำกัดการรับ JWT ผ่าน Query String** | ตัดการอ่าน `req.query.token` ออกจาก middleware `authenticate` ทั่วไปอย่างเด็ดขาด บังคับให้ REST API ทั้งหมดต้องส่งผ่าน HTTP Header `Authorization: Bearer <token>` เท่านั้น และจำกัดให้ query token ใช้ได้เฉพาะ SSE stream ที่จำเป็นเนื่องจากข้อจำกัดของเบราว์เซอร์ `EventSource` | [`B_END/src/middlewares/auth.js`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/B_END/src/middlewares/auth.js)<br>[`F_END/src/context/RealtimeContext.jsx`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/F_END/src/context/RealtimeContext.jsx) |
| **3** | **ป้องกัน Default / Hard-coded Secret (Fail Safely)** | ลบ fallback ค่าเริ่มต้น เช่น `'your_jwt_secret'` และเพิ่มกลไก Fail-Safe: หากไม่มีการกำหนด `JWT_SECRET` หรือ Config เชื่อมต่อฐานข้อมูล (`DB_HOST`, `DB_USER`, `DB_NAME`) ระบบจะหยุดทำงานทันที (Throw fatal configuration error) ป้องกันไม่ให้ระบบรันด้วย Secret ที่ไม่ปลอดภัย | [`B_END/src/middlewares/auth.js`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/B_END/src/middlewares/auth.js)<br>[`B_END/src/db.js`](file:///c:/Users/n/Desktop/check-in_v2/checkinGGZ/GGZCHECKIN/B_END/src/db.js) |

---

## 🧪 ผลการทดสอบความปลอดภัย (Security Tests $\ge 3$ Cases)

| ลำดับ | การทดสอบ | เงื่อนไขการทดสอบ | Expected Status | Actual Status | ผลการทดสอบ |
|:---:|---|---|:---:|:---:|:---:|
| **Case 1** | **ไม่มี Token (No Token)** | เรียก protected endpoint `GET /api/attendance/my/today` โดยไม่ส่ง Authorization header | `401 Unauthorized` | **401** | ✅ **PASS** |
| **Case 2** | **Token ไม่ถูกต้อง / Forged Token** | เรียก protected endpoint ด้วย signature ปลอม (`eyJhbGci...invalid_signature`) | `401 Unauthorized` | **401** | ✅ **PASS** |
| **Case 3** | **ยกเลิก Query Token ใน REST API** | เรียก `GET /api/attendance/my/today?token=...` โดยไม่ส่ง Bearer Header | `401 Unauthorized` | **401** | ✅ **PASS** |
| **Case 4** | **ป้องกัน IDOR / สิทธิ์ข้ามบุคคล** | User A (Role: `employee`) พยายามเข้าถึง Attendance Events ของ User B (`GET /api/attendance/events/5`) | `403 Forbidden` | **403** | ✅ **PASS** |
| **Case 5** | **SSE เชื่อมต่อโดยไม่มี Token** | เรียก `GET /api/events` โดยไม่ส่ง Token | `401 Unauthorized` | **401** | ✅ **PASS** |
| **Case 6** | **SSE เชื่อมต่อด้วย Token ที่ถูกต้อง** | เชื่อมต่อ `GET /api/events?token=...` ด้วย Token ของพนักงานที่ล็อกอินแล้ว | `200 OK (text/event-stream)` | **200** | ✅ **PASS** |

---

## 🔄 ผลการทดสอบ E2E Flow (Login ➔ Check-in ➔ Check-out)

ทดสอบการทำงานของระบบหลักเพื่อยืนยันว่าการเสริมความปลอดภัยไม่กระทบการใช้งานจริง:
- **ผู้ใช้ทดสอบ:** `employee5@company.com`

| ขั้นตอน | การกระทำ | Method & Endpoint | Status | ข้อมูลตอบกลับ |
|:---:|---|---|:---:|---|
| **1** | เข้าสู่ระบบ | `POST /api/auth/login` | **200 OK** | ได้รับ Access Token เรียบร้อย |
| **2** | เช็กอินเข้างาน | `POST /api/attendance/check-in` | **200 OK** | บันทึกพิกัด GPS + รูปถ่าย Selfie สำเร็จ |
| **3** | ตรวจสอบสถานะ | `GET /api/attendance/my/today` | **200 OK** | เวลาเช็กอิน: `2026-09-17T10:39:04.067Z` |
| **4** | เช็กเอาต์ออกงาน | `POST /api/attendance/check-out` | **200 OK** | บันทึกเวลาออกงานสำเร็จ |
| **5** | ตรวจสอบสถานะครบวงจร | `GET /api/attendance/my/today` | **200 OK** | บันทึกเวลาทั้ง `check_in_at` และ `check_out_at` ครบถ้วน |

---

## 🖥️ Terminal Runtime Log Evidence (`node B_END/test_day03_security.js`)

```text
====================================================
🛡️  DAY 03 SECURITY TEST SUITE & E2E VERIFICATION
====================================================

--- 🔑 Authenticating Test Users ---
Logged in as User A: employee1@company.com (ID: 4, Role: employee) | Token: eyJhbGciOi...HG82Oc [REDACTED]
Logged in as User B: employee2@company.com (ID: 5, Role: employee) | Token: eyJhbGciOi...vGstb0 [REDACTED]

----------------------------------------------------

--- 🛡️ PART 1: Security Negative Tests ---
✅ [PASS] Case 1: ไม่มี Token ส่งไปยัง Protected Endpoint -> ปฏิเสธ 401 Unauthorized
   Status: 401 | Error: "กรุณาเข้าสู่ระบบ"

✅ [PASS] Case 2: Token ไม่ถูกต้อง / Forged Token -> ปฏิเสธ 401 Unauthorized
   Status: 401 | Error: "Token ไม่ถูกต้อง"

✅ [PASS] Case 3: ยกเลิก Query Token สำหรับ REST API (?token=...) -> ปฏิเสธ 401 Unauthorized
   Status: 401 | Expected: 401 | Response: "กรุณาเข้าสู่ระบบ"

✅ [PASS] Case 4: Employee A เข้าถึงข้อมูล Attendance Events ของ Employee B (IDOR) -> ปฏิเสธ 403 Forbidden
   Status: 403 | Response: "คุณไม่มีสิทธิ์เข้าถึงข้อมูล attendance ของผู้ใช้อื่น"

✅ [PASS] Case 5: เข้าถึง /api/events (SSE) โดยไม่มี Token -> ปฏิเสธ 401 Unauthorized
   Status: 401 | Response: "กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ Event Stream"

--- 📡 PART 2: SSE Realtime Stream Positive Verification ---
✅ [PASS] Case 6: เชื่อมต่อ /api/events (SSE) ด้วย Token ที่ถูกต้อง -> สำเร็จ 200 OK (text/event-stream)
   Status: 200 | Content-Type: text/event-stream

--- 🔄 PART 3: E2E Core Attendance Flow (Employee 5) ---
Step 1: Login as employee5@company.com (Status: 200)
Step 2: Check-in -> Status: 200 | Message: "Check-in สำเร็จ"
Step 3: GET /my/today -> Status: 200 | Check-in at: 2026-09-17T10:39:04.067Z
Step 4: Check-out -> Status: 200 | Message: "Check-out สำเร็จ"
Step 5: Final Status -> Check-in: 2026-09-17T10:39:04.067Z | Check-out: 2026-09-17T10:39:04.380Z
✅ [PASS] Case 7: E2E Full Attendance Cycle (Login -> Check-in -> Status -> Check-out -> Final Verify)
   Complete attendance lifecycle verified successfully.

====================================================
🏁 TEST RESULTS SUMMARY: 7 / 7 TESTS PASSED
🎉 ALL DAY 03 SECURITY & E2E TESTS PASSED WITH 100% SUCCESS!
====================================================
```

---

## 📦 ข้อมูลการส่งงาน (Submission Deliverables)

- **Branch:** `day03-security`
- **Security Tests:** ผ่านครบ 7 เคส (Negative $\ge 3$ cases: 100% PASS)
- **Attendance E2E:** ผ่านครบวงจร (Login ➔ Check-in ➔ Check-out: 100% PASS)
- **PR Status:** พร้อมส่ง Pull Request เข้าสู่ Branch `main`
