# Hostel Management System

Academic DBMS project (first year): React frontend, Node.js + Express backend, MySQL database. Authentication with signup/login and role-based access (Admin, Student, Guardian). Sessions via express-session (no JWT).

---

## Quick start (for demo / showing the teacher)

1. **MySQL** – Create database: `CREATE DATABASE hostel_management;` (or use your existing one). The app will add missing columns on first run.
2. **Backend** – In `backend/`: create `.env` with `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=your_mysql_password`, `DB_NAME=hostel_management`, then run `npm install` and `npm start`. Server runs at http://localhost:5000.
3. **Frontend** – In `frontend/`: run `npm install` and `npm run dev`. Open http://localhost:5173 in the browser.

Then: **Sign up** (choose role Admin/Student/Guardian), **Log in**, and use the dashboards. That’s enough to show the project works.

---

## Prerequisites

- Node.js (v16+)
- MySQL (existing database with tables: `student`, `staff`, `hostel`, `room`, `fees`, `attendance`)
- Student table must have primary key `student_id` (if your PK is different, edit `database/schema.sql` FK)

---

## 1. Database Setup

**Option A (recommended for demo):** Use database `hostel_management` with your existing tables. Create it if needed: `CREATE DATABASE hostel_management;` When you start the backend, it will add missing columns (`users.name`, `users.linked_student_id`, `student.user_id`) automatically.

**Option B:** Use `hostel_db`: create database, then run `database/schema.sql` and `database/02_student_alter.sql` if your tables don’t have those columns yet.

---

## 2. Backend (Node + Express)

```bash
cd backend
npm install
```

Create `.env` in `backend/` (copy from `.env.example`). For demo you only need:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_management
```

`PORT`, `SESSION_SECRET`, and `FRONTEND_URL` have defaults; set them if you need to.

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

---

## 8. Production & Deployment

### Backend production checklist

- Set **SESSION_SECRET** to a long random string (e.g. `openssl rand -hex 32`).
- Set **NODE_ENV=production**.
- Use **MySQL session store**: `SESSION_STORE=mysql` (or leave unset in production; server uses MySQL store when `NODE_ENV=production`).
- Set **FRONTEND_URL** to your frontend origin (for CORS and cookies).
- Run migrations: backend runs `ensureMigrations()` on startup (adds `name`, `linked_student_id` to `users`, `user_id` to `student` if missing).

### Frontend production build

```bash
cd frontend
npm install
# If API is on a different origin, set VITE_API_URL before building:
# Windows: set VITE_API_URL=https://api.yoursite.com
# Unix:    export VITE_API_URL=https://api.yoursite.com
npm run build
```

Serve the `frontend/dist` folder with any static server or reverse proxy (e.g. nginx). Ensure cookies and CORS are configured for your API origin.

### Docker (MySQL + Backend)

From `DBMS_Software/`:

```bash
# Set env (or create .env in DBMS_Software with DB_PASSWORD, SESSION_SECRET, FRONTEND_URL)
export DB_PASSWORD=your_mysql_password
export SESSION_SECRET=$(openssl rand -hex 32)
export FRONTEND_URL=http://localhost:5173

docker compose up -d
```

- MySQL: port 3306 (create DB `hostel_management` if not using `MYSQL_DATABASE`).
- Backend: port 5000. On first run it creates the database and tables if they don’t exist.

To use an **existing** MySQL server instead of the container, run only the backend (e.g. `node server.js`) and set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`.
