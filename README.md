# 📋 ระบบ Online Attendance Check-in (checkinGGZ)

ระบบเช็กอินพนักงานออนไลน์ พัฒนาด้วย React + Node.js (Express) + PostgreSQL  
รันทุกอย่างด้วย **Docker Compose** คำสั่งเดียว

---

## 🚀 วิธีรันระบบ

### ข้อกำหนดเบื้องต้น
- ติดตั้งและเปิดใช้งาน [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) ให้เรียบร้อยก่อน

---

### วิธีที่ 1: แบบ 1-Click (แนะนำสำหรับ Windows ⚡)

ภายในโฟลเดอร์นี้มีไฟล์สคริปต์ `.bat` เตรียมไว้ให้เพื่อความสะดวก:

| ไฟล์ | การใช้งาน | รายละเอียด |
|------|-----------|------------|
| **`setup.bat`** | **รันครั้งแรก / หลัง Clone** | สั่ง Build Containers, เริ่มระบบ DB + Backend + Frontend, สร้างข้อมูลตัวอย่าง (Seed Data) และเปิดเบราว์เซอร์ให้อัตโนมัติ |
| **`start.bat`** | **รันครั้งต่อไป** | เปิดระบบทำงานทันที ไม่ต้องเสียเวลา Build ใหม่ ข้อมูลใน DB ยังอยู่ครบ |
| **`stop.bat`** | **หยุดการทำงาน** | สั่งปิด Containers อย่างปลอดภัย |

> 💡 **การใช้งาน**: เพียงแค่ดับเบิลคลิกที่ไฟล์ **`setup.bat`** เพื่อเริ่มต้นใช้งานได้ทันที!

---

### วิธีที่ 2: ผ่าน Command Line (CLI)

```bash
# 1. Clone repository
git clone <private-repo-url>
cd checkinGGZ

# 2. สร้างและรัน containers ทั้งหมด (DB + Backend + Frontend)
docker-compose up --build -d

# 3. สร้างข้อมูลตัวอย่างสำหรับการทดสอบ (รันครั้งแรกเท่านั้น)
docker-compose exec backend node src/seed.js

# 4. เข้าใช้งานผ่านเบราว์เซอร์
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
```

#### การหยุด / จัดการ Containers
```bash
docker-compose stop          # หยุดการทำงานชั่วคราว (ข้อมูลยังอยู่)
docker-compose up -d         # เปิดทำงานใหม่อีกครั้ง
docker-compose down          # ลบ containers
docker-compose down -v       # ลบ containers + ลบ volume ฐานข้อมูลทั้งหมด
```

---

## 🔐 ข้อมูลล็อกอินตัวอย่าง

| Email | Password | Role |
|-------|----------|------|
| `employee1@company.com` | `123456` | Employee |
| `employee2@company.com` | `123456` | Employee |
| `manager@company.com` | `123456` | Manager |
| `admin@company.com` | `123456` | Admin |
| `superadmin@company.com` | `123456` | Super Admin |

> ⚠️ **ข้อมูลตัวอย่างเท่านั้น** — ไม่ใช้ข้อมูลพนักงานจริง

---

## ✅ ฟีเจอร์ที่เสร็จแล้ว (Completed)

- [x] **Login** — ล็อกอินด้วยอีเมล + รหัสผ่าน (JWT Authentication)
- [x] **Check-in** — บันทึกเวลาเข้างาน + GPS + ถ่าย Selfie
- [x] **Check-out** — บันทึกเวลาออกงาน + GPS + ถ่าย Selfie
- [x] **Docker Compose** — รัน PostgreSQL + Backend + Frontend ด้วยคำสั่งเดียว
- [x] **Seed Data** — ข้อมูลตัวอย่าง (users, schedules, roles)
- [x] **Responsive UI** — รองรับมือถือ + Desktop

## ❌ ฟีเจอร์ที่ยังค้าง (Pending)

- [ ] ประวัติการเช็กอิน (History Page)
- [ ] ลาหยุด / WFH (Leave Requests)
- [ ] Admin Dashboard
- [ ] รายงานรายเดือน (Monthly Reports)
- [ ] จัดตารางเวลาทำงาน (Work Schedules Management)
- [ ] ระบบแจ้งเตือน (Notifications)
- [ ] แก้ไขเวลา (Edit Requests)

---

## 🏗️ โครงสร้างโปรเจกต์

```
checkinGGZ/
├── docker-compose.yml      # รัน 3 services: db, backend, frontend
├── .gitignore
├── README.md               # ← คุณอยู่ที่นี่
│
├── B_END/                  # Node.js + Express API
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js        # Entry point
│       ├── db.js           # PostgreSQL connection
│       ├── seed.js         # สร้างข้อมูลตัวอย่าง
│       ├── routes/
│       │   ├── auth.js     # Login / Refresh / Me
│       │   └── attendance.js # Check-in / Check-out
│       ├── middlewares/
│       │   ├── auth.js     # JWT verify + role-based auth
│       │   └── upload.js   # Selfie image upload
│       └── utils/
│           ├── realtime.js # SSE broadcast
│           └── mailer.js   # OTP email
│
├── F_END/                  # React + Vite + TailwindCSS
│   ├── Dockerfile
│   ├── nginx.conf          # Proxy /api → backend
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx         # Main app (Login → Attendance)
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   └── EmployeeAttendancePage.jsx
│       ├── components/     # Navbar, CameraModal, etc.
│       ├── context/        # AuthContext, RealtimeContext
│       ├── services/       # API client
│       └── styles/         # Design tokens
│
└── report/                 # เอกสารส่งงาน
    ├── summary.md
    └── features.md
```

---

## 🛠️ เทคโนโลยีที่ใช้

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4, Framer Motion, Lucide Icons |
| Backend | Node.js 22, Express 4, JWT, bcryptjs |
| Database | PostgreSQL 16 |
| DevOps | Docker, Docker Compose, nginx |

---

## ⚠️ ข้อควรระวัง

- 🔴 ยังไม่ต้องแปลงเป็น APK
- 🔴 ห้ามใช้ข้อมูลพนักงานจริง
- 🔴 ซอร์สโค้ดมาอย่างเดียว (ไม่คัดลอกจากที่อื่นมาใช้)
- 🔴 ใช้ข้อมูลตัวอย่างเท่านั้น
