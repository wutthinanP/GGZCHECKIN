# 📄 สรุปโจทย์ — ระบบ Online Attendance Check-in

## 1. ปัญหา (Problem)
องค์กรต้องการระบบเช็กอินออนไลน์ที่พนักงานสามารถบันทึกเวลาเข้า-ออกงานผ่านเว็บเบราว์เซอร์
โดยระบบต้องรองรับการยืนยันตัวตนด้วย GPS + ถ่ายรูป Selfie เพื่อป้องกันการทุจริต

## 2. ขอบเขตที่ทำ (Scope — Node 02)
ในขั้นตอนนี้ เปิดเฉพาะฟีเจอร์หลัก 3 ส่วน:

| ฟีเจอร์ | คำอธิบาย |
|---------|----------|
| **Login** | ล็อกอินด้วยอีเมล + รหัสผ่าน (JWT) |

| **Check-in** | บันทึกเวลาเข้างาน พร้อม GPS + Selfie |
| **Check-out** | บันทึกเวลาออกงาน พร้อม GPS + Selfie |

> ฟีเจอร์อื่น ๆ (ประวัติ, ลาหยุด, WFH, Admin Dashboard, รายงาน) จะทำในขั้นตอนถัดไป

## 3. เทคโนโลยี (Technology)

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 8, TailwindCSS 4, Framer Motion |
| Backend | Node.js 22, Express 4, JWT, bcryptjs, PostgreSQL (pg) |
| Database | PostgreSQL 16 (Docker container) |
| DevOps | Docker, Docker Compose, nginx |

## 4. วิธีการทำงาน (Approach)
- ก๊อปโค้ดจากโปรเจกต์เดิม (`check-in_v2/F_END` + `check-in_v2/B_END`)
- ตัดฟีเจอร์ที่ไม่ได้ใช้ออก (ลบ routes, ลบ pages)
- ใช้ Docker Compose จำลอง PostgreSQL database + Backend + Frontend
- ใช้ `seed.js` สร้างข้อมูลตัวอย่าง (users, roles, schedules)
- **ไม่ใช้ข้อมูลพนักงานจริง** — ใช้ข้อมูลตัวอย่างเท่านั้น

## 5. ผลลัพธ์ (Result)
- เว็บเช็กอินที่รันได้ด้วย `docker-compose up --build`
- ผู้ใช้สามารถ Login → Check-in → Check-out ได้สมบูรณ์
- พร้อม README, วิธีรัน, รายการฟีเจอร์, ภาพหน้าจอ

## 6. การทดสอบและการรักษาความปลอดภัย (Verification & Security - Day 02)
- **Authorization Enforcement (`/api/attendance/events/:attendanceId`):** จำกัดสิทธิ์ให้ผู้ใช้ทั่วไป (employee) เข้าถึงได้เฉพาะ attendance events ของตนเองเท่านั้น หากพยายามเปิดดูของผู้อื่น ระบบจะคืนค่า `403 Forbidden` โดยอนุญาตให้เฉพาะ role ที่มีสิทธิ์ (`manager`, `admin`, `super_admin`)
- **Negative Authorization Test Evidence:** ทดสอบ Login เป็น User A พยายามเข้าถึงข้อมูลของ User B ได้รับ `403 Forbidden` พร้อมบันทึกผลการทดสอบใน `report/day02_evidence.md`
- **E2E Runtime Evidence:** ทดสอบกระบวนการ Login → Check-in → GET /my/today → Check-out ครบวงจรและบันทึก log ใน `report/day02_evidence.md`
- **Automated Test Script:** มีสคริปต์ทดสอบ `B_END/test_day02.js` สำหรับรันตรวจสอบอัตโนมัติ

## 7. การยกระดับความปลอดภัยขั้นสูง (Security Hardening & Negative Tests - Day 03)
- **SSE Stream Security (`/api/events`):** ปิดกั้นไม่ให้เข้าถึงแบบ Public โดยเพิ่ม `authenticateSSE` บังคับตรวจสอบ JWT ก่อนเชื่อมต่อ Realtime SSE Stream
- **Discontinue Query Token in REST:** ตัดการรับ JWT ผ่าน Query String (`?token=...`) ใน REST APIs เพื่อป้องกัน Token รั่วไหลผ่าน Browser History และ Server Access Logs
- **Fail-Safe Secret & DB Config:** ป้องกัน Default/Hard-coded secrets โดยระงับการทำงานทันทีกรณีไม่มี `JWT_SECRET` หรือ DB configuration ที่จำเป็น
- **Automated Security Test Suite:** สคริปต์ `B_END/test_day03_security.js` ตรวจสอบ Negative tests 5 เคส (No Token, Invalid Token, Query Token on REST, IDOR, SSE without token) พร้อม E2E Flow ผ่าน 100%
- **Evidence Report:** บันทึกหลักฐานฉบับสมบูรณ์ใน `report/day03_evidence.md`


