# Hostel Management System

Academic DBMS project: React frontend, Node.js + Express backend, MySQL database. Authentication with signup/login and role-based access (Admin, Student, Guardian). Sessions via express-session (no JWT).

---

## Prerequisites

- Node.js (v16+)
- MySQL (existing database with tables: `student`, `staff`, `hostel`, `room`, `fees`, `attendance`)
- Student table must have primary key `student_id` (if your PK is different, edit `database/schema.sql` FK)

---

## 1. Database Setup

1. Create database: `CREATE DATABASE hostel_db; USE hostel_db;`
2. Ensure existing tables exist (student, staff, hostel, room, fees, attendance).
3. Run SQL in order:
   - `database/schema.sql` — creates `users` table (run after `student` table exists).
   - `database/02_student_alter.sql` — adds `user_id`, `guardian_name`, `guardian_phone` to `student` (skip any statement if column already exists).

---

## 2. Backend (Node + Express)

```bash
cd backend
npm install
```

Create `.env` (copy from `.env.example`):

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_db
SESSION_SECRET=your-secret-string
FRONTEND_URL=http://localhost:5173
```

Start server:

```bash
npm start
```

Server runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

---

## 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. API calls are proxied to `http://localhost:5000` (see `vite.config.js`).

---

## 4. How to Use

1. **Sign up** (/) → Sign Up → enter name, email, password, role (Admin/Student/Guardian). Guardian can optionally set Linked Student ID.
2. **Log in** (/) → Log In → email, password, and **select role** (Admin / Student / Guardian). Wrong role returns an error.
3. **Admin** → full access; dashboard lists students.
4. **Student** → dashboard shows own profile, room, fees, attendance (student must be linked via `student.user_id` to the logged-in user).
5. **Guardian** → read-only dashboard for the student linked by `users.linked_student_id`.

---

## 5. Project Structure

```
DBMS_Software/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/requireLogin.js, requireRole.js
│   ├── routes/auth.js        # signup, login, logout, me
│   ├── routes/student.js     # /me (student/guardian), /list (admin)
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js            # auth & student API helpers
│   │   ├── App.jsx            # routes + protected routes
│   │   ├── components/Layout.jsx
│   │   └── pages/            # Landing, Signup, Login, AdminDashboard, StudentDashboard, GuardianDashboard
│   ├── index.html, vite.config.js, tailwind.config.js
│   └── package.json
├── database/
│   ├── schema.sql            # users table
│   └── 02_student_alter.sql  # student table alterations
└── README.md
```

---

## 6. API Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/signup | No | - | Register (name, email, password, role, optional linked_student_id) |
| POST | /api/auth/login | No | - | Login (email, password, role) |
| POST | /api/auth/logout | Yes | Any | Destroy session |
| GET | /api/auth/me | Yes | Any | Current user |
| GET | /api/student/me | Yes | student, guardian | Own/linked student data (profile, room, fees, attendance) |
| GET | /api/student/list | Yes | admin | List all students |
| GET | /api/student/:id | Yes | admin or owner | Get one student |

---

## 7. Linking Student to Login

- **Student role:** The row in `student` with `user_id = <logged-in user's user_id>` is “own data”. Ensure one student row has `user_id` set to the user’s `user_id` after signup.
- **Guardian role:** Set `users.linked_student_id` to the student’s `student_id` (at signup or via DB update) so the guardian sees that student’s data.

Example (after one user signs up as student with `user_id = 1`):

```sql
UPDATE student SET user_id = 1 WHERE student_id = 101;
```

Example (guardian sees student 101):

```sql
UPDATE users SET linked_student_id = 101 WHERE user_id = 2 AND role = 'guardian';
```
