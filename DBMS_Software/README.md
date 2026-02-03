# Hostel Management System

Academic DBMS project (first year): React + Vite frontend, Node.js + Express backend, MySQL database. Role-based auth (Admin, Student, Guardian) with sessions; signup is **Student or Guardian only**—admin accounts are created via the database.

---

## Quick start (for demo)

1. **MySQL** – Create database: `CREATE DATABASE hostel_management;` The backend adds missing columns on first run.
2. **Backend** – In `backend/`: copy `.env.example` to `.env`, set `DB_PASSWORD` and `DB_NAME=hostel_management`, then `npm install` and `npm start`. Server: http://localhost:5000.
3. **Frontend** – In `frontend/`: `npm install` and `npm run dev`. Open http://localhost:5173.
4. **First admin** – Admin cannot sign up via UI. Create one in the DB (see §9) or temporarily add `'admin'` to `allowedSignupRoles` in `backend/routes/auth.js` for demo only.

Then: **Sign up** as Student or Guardian, **Log in** (choose your role), and use the dashboards. Session persists on page reload.

---

## Features (current progress)

- **Auth:** Signup (Student / Guardian only), login (all roles), logout. Passwords hashed with bcrypt; input validation (email, password length, role).
- **Session:** Cookie-based sessions; optional MySQL session store in production. Session survives page reload (AuthContext + cookie handling).
- **Roles:** Admin (dashboard + student list), Student (own profile, room, fees, attendance), Guardian (read-only view of linked student).
- **Security:** Helmet, rate limiting (API + auth routes), CORS with credentials. Admin cannot self-register.
- **DB:** MySQL; connection pool; auto-migrations on startup (adds `users.name`, `users.linked_student_id`, `student.user_id` if missing). Works with existing `hostel_management` schema.
- **UI:** Landing, Login, Signup, Admin Dashboard, shared Student/Guardian Dashboard. Same background image and neutral (slate) theme across pages. Layout with header and logout.
- **Deployment:** Backend Dockerfile, docker-compose (MySQL + backend), `.env.example` for backend and frontend. Frontend supports `VITE_API_URL` for production API origin.

---

## Prerequisites

- Node.js (v16+)
- MySQL (database `hostel_management` or create it; tables: `users`, `student`, `room`, `fees`, `attendance`, etc.)

---

## 1. Database Setup

**Recommended:** Use database `hostel_management`. Create it if needed: `CREATE DATABASE hostel_management;` On first backend start, `ensureMigrations()` adds missing columns: `users.name`, `users.linked_student_id`, `student.user_id`.

**Alternative:** Use `hostel_db` and run `database/schema.sql` and `database/02_student_alter.sql` if your schema doesn’t have those columns. Optional: `database/03_migrate_linkage.sql` for manual linkage columns.

---

## 2. Backend (Node + Express)

```bash
cd backend
npm install
```

Create `.env` (copy from `.env.example`). Minimum for demo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_management
```

Optional: `PORT`, `SESSION_SECRET`, `FRONTEND_URL`, `SESSION_STORE` (use `mysql` for persistent sessions).

```bash
npm start
```

Server: http://localhost:5000. Health: `GET http://localhost:5000/api/health`.

---

## 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173. API is proxied to the backend (see `vite.config.js`).

---

## 4. How to Use

1. **Sign up** – From Landing, go to Sign Up. Enter name, email, password (min 8 chars), and role **Student** or **Guardian**. Admin is not an option; create admin via DB (§7).
2. **Log in** – Email, password, and select role (Admin / Student / Guardian). Wrong role returns an error.
3. **Admin** – After logging in as admin, access Admin Dashboard: view list of students.
4. **Student** – Dashboard shows own profile, room, fees, attendance (student row must have `user_id` set to your user; signup as student creates this link).
5. **Guardian** – Read-only dashboard for the student linked by `users.linked_student_id` (set at signup or in DB).

---

## 5. Tables vs your ER diagram (8 tables)

Your ER diagram has **8 tables**: HOSTEL, ROOM, STUDENT, STAFF, FEES, ATTENDANCE, ROOM_ALLOCATION, USERS.

The backend creates **6 tables** by default: `users`, `student`, `room`, `fees`, `attendance`, and **`registration_requests`**. It does **not** create `hostel`, `staff`, or `room_allocation` (it only inserts into `room_allocation` if that table already exists).

So if you see **9 tables** in the database, the extra one is **`registration_requests`**. It was added for the app’s room registration workflow (student submits a request → admin approves / marks paid). It is **not** part of your original 8-table ER; it is an application-level table. You can document it in your report as an extension, or drop it and adjust the app if you want to stick strictly to 8 tables.

---

## 6. Project Structure

```
DBMS_Software/
├── backend/
│   ├── config/db.js              # MySQL pool, ensureDatabase, ensureMigrations, ensureTables
│   ├── middleware/requireLogin.js, requireRole.js
│   ├── routes/auth.js             # signup, login, logout, me
│   ├── routes/student.js         # /me (student/guardian), /list (admin), /:id
│   ├── server.js                  # Express, helmet, rate-limit, session, CORS
│   ├── .env.example
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js                 # API base (VITE_API_URL), auth, student
│   │   ├── App.jsx                # Routes, ProtectedRoute
│   │   ├── main.jsx               # BrowserRouter, AuthProvider
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Dashboard.jsx      # Shared Student + Guardian dashboard
│   │   └── utils/roles.js
│   ├── .env.example
│   ├── vite.config.js             # Proxy /api to backend
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── 02_student_alter.sql
│   ├── 03_migrate_linkage.sql
│   ├── schema.txt                 # Table list + ER summary
│   ├── ER-diagram.md
│   └── ER-diagram.html
├── docker-compose.yml             # MySQL + backend
└── README.md
```

---

## 7. API Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/signup | No | - | Register (name, email, password, role=**student** or **guardian** only) |
| POST | /api/auth/login | No | - | Login (email, password, role) |
| POST | /api/auth/logout | Yes | Any | Destroy session |
| GET | /api/auth/me | Yes | Any | Current user |
| GET | /api/student/me | Yes | student, guardian | Own/linked student (profile, room, fees, attendance) |
| GET | /api/student/list | Yes | admin | List all students |
| GET | /api/student/:id | Yes | admin or owner | Get one student |
| POST | /api/seed/demo | Yes | admin | Load demo data (students, registration requests, rooms) for evaluation |
| GET | /api/health | No | - | Health check |

---

## 8. For Professor / Evaluation (Demo Data)

To show a **realistic, populated dashboard** without manually creating students or submitting registration requests:

1. **Create an admin** (see §9 below) and log in as admin.
2. Open **Admin Dashboard**. If there are no students and no registration requests, a green **"Load demo data (for evaluation)"** button appears.
3. Click it. The backend will insert:
   - A demo admin user (if none exists): `admin@hostel.demo` / `Admin123!`
   - 2–3 demo students (users + student records): e.g. Rahul Kumar, Priya Sharma, Amit Singh
   - 2–3 room registration requests (mix of PENDING and APPROVED)
   - Sample rooms (e.g. R-101, R-102)
4. The dashboard refreshes automatically. You can then **Approve**, **Reject**, or **Mark payment received** on requests to demonstrate the full flow.

This makes the project evaluation-ready: the professor can see students, requests, and room/fee workflows without running the student registration flow first.

---

## 8. Creating an Admin Account

Admin cannot sign up through the UI. Create the first admin in the database.

**Option A – SQL (after generating bcrypt hash):**

```bash
# In backend folder: node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
```

```sql
INSERT INTO users (email, password, name, role) VALUES ('admin@hostel.edu', '<paste-bcrypt-hash>', 'Admin', 'admin');
```

**Option B – Demo only:** In `backend/routes/auth.js`, add `'admin'` to `allowedSignupRoles` temporarily so you can sign up as Administrator from the UI. Remove it after creating the first admin.

---

## 10. Linking Student to Login

- **Student:** The `student` row with `user_id = <your user_id>` is “your” data. Signing up as Student creates this link automatically.
- **Guardian:** Set `users.linked_student_id` to the student’s `student_id` (at signup or in DB) so the guardian sees that student’s dashboard.

Examples:

```sql
-- Link user 1 to student 101 (if not already done by signup)
UPDATE student SET user_id = 1 WHERE student_id = 101;

-- Guardian user 2 sees student 101
UPDATE users SET linked_student_id = 101 WHERE user_id = 2 AND role = 'guardian';
```

---

## 11. Remove a registered account from the DB

If you see **"Email or Student ID already registered"** and want to sign up again with the same email (or Student ID), delete that student record and related rows from MySQL.

**1. Connect to MySQL** (use your DB name, e.g. `hostel_management`):

```bash
mysql -u root -p hostel_management
```

**2. Find the student** (by email or Student ID):

```sql
-- By email
SELECT student_id, student_code, name, email FROM student WHERE email = 'your@email.com';

-- By Student ID (e.g. AH26-101)
SELECT student_id, student_code, name, email FROM student WHERE student_code = 'AH26-101';
```

**3. Delete dependent rows** (replace `YOUR_STUDENT_ID` with the `student_id` from step 2):

```sql
SET @sid = YOUR_STUDENT_ID;

DELETE FROM fees WHERE student_id = @sid;
DELETE FROM attendance WHERE student_id = @sid;
DELETE FROM registration_requests WHERE student_id = @sid;
-- If room_allocation exists:
DELETE FROM room_allocation WHERE student_id = @sid;
```

**4. Delete the student row:**

```sql
DELETE FROM student WHERE student_id = @sid;
```

**Example (student_id = 5):**

```sql
DELETE FROM fees WHERE student_id = 5;
DELETE FROM attendance WHERE student_id = 5;
DELETE FROM registration_requests WHERE student_id = 5;
DELETE FROM room_allocation WHERE student_id = 5;   -- if table exists
DELETE FROM student WHERE student_id = 5;
```

After this, you can sign up again with the same email or get a new Student ID.

---

## 12. Production & Deployment

### Backend

- Set **SESSION_SECRET** (e.g. `openssl rand -hex 32`).
- Set **NODE_ENV=production**.
- Use **SESSION_STORE=mysql** for persistent sessions (optional; default in production tries MySQL store).
- Set **FRONTEND_URL** to your frontend origin.

### Frontend build

```bash
cd frontend
npm install
# If API is on another origin:
# export VITE_API_URL=https://api.yoursite.com   # or set in .env
npm run build
```

Serve `frontend/dist` with a static server or reverse proxy.

### Docker (MySQL + Backend)

From `DBMS_Software/`:

```bash
export DB_PASSWORD=your_mysql_password
export SESSION_SECRET=$(openssl rand -hex 32)
export FRONTEND_URL=http://localhost:5173
docker compose up -d
```

- MySQL: port 3306.
- Backend: port 5000; on first run it creates DB and tables if missing.

To use an existing MySQL server, run only the backend and set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`.
