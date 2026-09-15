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
