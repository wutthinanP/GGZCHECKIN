# 📋 รายการฟีเจอร์ — ระบบ Online Attendance Check-in

## ✅ Completed (เสร็จแล้ว)

### 🔐 Authentication
- [x] Login ด้วยอีเมล + รหัสผ่าน
<img width="1135" height="967" alt="image" src="https://github.com/user-attachments/assets/9df5d7df-1e0c-443a-8853-31966113210e" />

- [x] JWT Access Token + Refresh Token
- [x] Auto token refresh เมื่อ access token หมดอายุ
- [x] Logout (ลบ token ออกจาก localStorage)

### 📍 Check-in
- [x] บันทึกเวลาเข้างาน (check_in_at)
- [x] เก็บพิกัด GPS (latitude, longitude, accuracy)
- [x] ถ่ายรูป Selfie ตอน Check-in
- [x] คำนวณเวลามาสาย (late_minutes) เทียบกับตารางเวลาทำงาน
- [x] ป้องกัน Check-in ซ้ำในวันเดียวกัน
<img width="1565" height="932" alt="image" src="https://github.com/user-attachments/assets/e3db746d-537f-45e6-917b-5536f82b3e52" />

### 🚪 Check-out
- [x] บันทึกเวลาออกงาน (check_out_at)
- [x] เก็บพิกัด GPS
- [x] ถ่ายรูป Selfie ตอน Check-out
- [x] คำนวณเวลาทำงาน (worked_minutes)
- [x] คำนวณ OT (overtime_minutes)
- [x] ป้องกัน Check-out ซ้ำ + ต้อง Check-in ก่อน

### 🐳 Docker
- [x] Docker Compose (PostgreSQL + Backend + Frontend)
- [x] Dockerfile สำหรับ Backend (Node.js)
- [x] Dockerfile สำหรับ Frontend (React → nginx)
- [x] nginx reverse proxy (/api → backend)
- [x] Health check สำหรับ PostgreSQL

### 📝 เอกสาร
- [x] README.md (วิธีรัน, ข้อมูลล็อกอิน, โครงสร้างโปรเจกต์)
- [x] สรุปโจทย์ 1 หน้า (report/summary.md)
- [x] รายการฟีเจอร์ (report/features.md — ไฟล์นี้)
- [x] Seed data ข้อมูลตัวอย่าง (users, roles, schedules)

### 🎨 UI/UX
- [x] Glassmorphism design (KU Green Theme)
- [x] Responsive layout (มือถือ + Desktop)
- [x] Animation (Framer Motion)
- [x] Real-time clock display

---
### day2
แก้ไขการตรวจสิทธิ์ (Authorization) ของ attendance events ให้ผู้ใช้เห็นเฉพาะข้อมูลของตนเอง (ยกเว้น role ที่ได้รับอนุญาต)"
อธิบาย : โดยปกติจะไม่ให้ user เห็นหน้าต่างการขอประวัติผู้ใช้คนอื่น เเต่ในกรณีเผื่อมีสานเทคที่ดึงข้อมูลจาก postman (ตัวอย่าง) จึงต้องป้องกันไว้
/api/attendance/events/:attendanceId ให้เช็กว่า:
ถ้าคนเรียกเป็นเจ้าของ attendanceId นั้น ➜ อนุญาตให้ดู
หรือถ้าคนเรียกเป็น Role manager, admin, super_admin ➜ อนุญาตให้ดู
ถ้าเป็นพนักงานคนอื่น ➜ ตอบ 403 Forbidden ปฏิเสธการเข้าถึง

<img width="1257" height="662" alt="image" src="https://github.com/user-attachments/assets/c2b9f5f4-4580-4aca-ada7-023a09f44b27" />

---
## ❌ Pending (ยังค้าง)

### 📊 ระบบประวัติ
- [ ] หน้าประวัติการเช็กอิน (EmployeeHistoryPage)
- [ ] กรองตามวันที่ (startDate / endDate)

### 📋 ระบบคำขอ
- [ ] ลาหยุด (Leave Requests)
- [ ] ทำงานจากบ้าน (WFH Requests)
- [ ] แก้ไขเวลา (Edit Requests)

### 👔 Admin / Manager
- [ ] Admin Dashboard (สถิติรายวัน)
- [ ] ดูตำแหน่งพนักงานบนแผนที่
- [ ] อนุมัติ / ปฏิเสธคำขอ
- [ ] จัดการพนักงาน (CRUD)
- [ ] จัดตารางเวลาทำงาน (Work Schedules)

### 📈 รายงาน
- [ ] รายงานรายเดือน
- [ ] ส่งออก Excel / CSV

### 🔔 ระบบแจ้งเตือน
- [ ] Notification Drawer
- [ ] Real-time SSE notifications
- [ ] อีเมลแจ้งเตือน

### 🔒 ความปลอดภัยเพิ่มเติม
- [ ] ลืมรหัสผ่าน (OTP via Email)
- [ ] เปลี่ยนรหัสผ่าน
- [ ] Audit Logs
