# Online Project Review Slot Booking System

## MERN Stack College Project Review Scheduler

### Tech Stack

- MongoDB, Express.js, React.js, Node.js
- JWT + OTP Email Auth (Nodemailer)
- FullCalendar, TailwindCSS / MUI
- Excel/PDF/CSV Reports (exceljs, pdfkit, json2csv)

### Roles

1. **Admin (HOD)**: Manage users, batches, settings, reports
2. **Project Guide**: Approve/reject slot requests for assigned batches
3. **Student (Team Leader)**: Book slots for own batch

### Quick Start

1. Copy `.env.example` to `.env` and fill values
2. Backend: `cd backend && npm install && npm run dev`
3. Frontend: `cd frontend && npm install && npm start`
4. Admin login first to create users/batches (email/rollNo + OTP)

### API Endpoints

- POST /api/auth/login (email/rollNo)
- POST /api/auth/verify-otp
- Protected: /api/admin/_, /api/guide/_, /api/student/\*

### Features

- Role-based dashboards & permissions
- Calendar slot booking (10 slots/day max)
- Email notifications
- Batch-guide assignment
- Full reports download
