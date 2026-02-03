const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join(' ');
    res.status(400).json({ error: msg });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// ADMIN LOGIN: Hardcoded for academic/demo purpose only. NOT stored in DB.
// Valid: login_id = ADMIN, password = ADMIN@10. Reject all other admin attempts.
// ---------------------------------------------------------------------------
const ADMIN_LOGIN_ID = 'ADMIN';
const ADMIN_PASSWORD = 'ADMIN@10';

function isAdminLogin(loginId, password) {
  return (
    String(loginId || '').trim().toUpperCase() === ADMIN_LOGIN_ID &&
    String(password || '') === ADMIN_PASSWORD
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ER: STUDENT = primary entity (all profile data). USERS = auth only (login_id, password_hash, role).
// Signup: 1) Generate student_code (AH26-XXX). 2) Insert STUDENT (all fields, no password).
// 3) Insert one row in USERS (login_id = student_code, password_hash, role = student).
// Guardian uses same student_id at login; role assigned at login time via USERS.
// ---------------------------------------------------------------------------
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }),
    body('gender').optional().trim().isLength({ max: 20 }),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
    body('address').optional().trim().isLength({ max: 500 }),
    body('course').optional().trim().isLength({ max: 100 }),
    body('year').optional().isInt({ min: 1, max: 10 }).toInt().withMessage('Year must be 1–10'),
    body('guardian_name').optional().trim().isLength({ max: 255 }),
    body('guardian_phone').optional().trim().isLength({ max: 20 }),
    body('dob').optional().trim().isLength({ max: 20 }),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const {
      name,
      gender,
      phone,
      email,
      address,
      course,
      year,
      guardian_name,
      guardian_phone,
      dob,
      password,
    } = req.body;

    const userEmail = email.trim().toLowerCase();
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      // Check email or student ID already registered (STUDENT + USERS; USERS can have orphan rows from failed signups)
      const [existingByEmail] = await conn.execute(
        'SELECT student_id FROM student WHERE email = ? LIMIT 1',
        [userEmail]
      );
      if (existingByEmail.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'Email or Student ID already registered.' });
      }
      let existingInUsers = false;
      try {
        const [inUsers] = await conn.execute('SELECT user_id FROM users WHERE email = ? LIMIT 1', [userEmail]);
        existingInUsers = inUsers.length > 0;
      } catch (_) {
        // USERS may not have email column; ignore
      }
      if (existingInUsers) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'Email or Student ID already registered.' });
      }

      // Generate next student_code: AH26-101, AH26-102, ... (ER: STUDENT.student_id is PK; student_code for display/login)
      const [rows] = await conn.execute(
        "SELECT student_id, student_code FROM student WHERE student_code LIKE 'AH26-%' ORDER BY student_id DESC LIMIT 1"
      );
      let nextNum = 101;
      if (rows.length > 0 && rows[0].student_code) {
        const match = rows[0].student_code.match(/AH26-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const studentCode = `AH26-${nextNum}`;

      // 1) Insert USERS first so we have user_id for STUDENT when table has user_id FK
      const passwordHash = await bcrypt.hash(password, 10);
      let userResult;
      try {
        [userResult] = await conn.execute(
          'INSERT INTO users (login_id, password_hash, role, email, password) VALUES (?, ?, ?, ?, ?)',
          [studentCode, passwordHash, 'student', userEmail, passwordHash]
        );
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
          try {
            [userResult] = await conn.execute(
              'INSERT INTO users (login_id, password_hash, role, email) VALUES (?, ?, ?, ?)',
              [studentCode, passwordHash, 'student', userEmail]
            );
          } catch (e2) {
            [userResult] = await conn.execute(
              'INSERT INTO users (login_id, password, role, email) VALUES (?, ?, ?, ?)',
              [studentCode, passwordHash, 'student', userEmail]
            );
          }
        } else throw e;
      }
      const userId = userResult.insertId;

      // 2) Insert STUDENT (with user_id when column exists; optional dob)
      const [maxRows] = await conn.execute('SELECT COALESCE(MAX(student_id), 0) + 1 AS nextId FROM student');
      const nextStudentId = maxRows[0]?.nextId ?? 1;
      const studentValues = [
        name.trim(),
        gender || null,
        phone || null,
        userEmail,
        address || null,
        course || null,
        year || null,
        guardian_name || null,
        guardian_phone || null,
      ];
      const dobVal = dob ? (dob.match(/^\d{4}-\d{2}-\d{2}$/) ? dob : null) : null;
      let studentInserted = false;
      try {
        await conn.execute(
          `INSERT INTO student (user_id, student_id, student_code, name, gender, phone, email, address, course, year, guardian_name, guardian_phone, dob)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, nextStudentId, studentCode, ...studentValues, dobVal]
        );
        studentInserted = true;
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
          try {
            await conn.execute(
              `INSERT INTO student (user_id, student_id, student_code, name, gender, phone, email, address, course, year, guardian_name, guardian_phone)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [userId, nextStudentId, studentCode, ...studentValues]
            );
            studentInserted = true;
          } catch (e2) {
            await conn.execute(
              `INSERT INTO student (student_id, student_code, name, gender, phone, email, address, course, year, guardian_name, guardian_phone)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [nextStudentId, studentCode, ...studentValues]
            );
            studentInserted = true;
          }
        } else throw e;
      }
      const studentId = nextStudentId;

      await conn.commit();
      conn.release();

      // Session: userId = USERS.user_id; studentId = STUDENT.student_id for downstream (FEES, ROOM_ALLOCATION, etc.)
      req.session.userId = userId;
      req.session.studentId = studentId;
      req.session.name = name.trim();
      req.session.role = 'student';
      req.session.studentCode = studentCode;
      req.session.email = email.trim().toLowerCase();
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Signup failed.' });
        }
        res.status(201).json({
          message: 'Signup successful. Use your Student ID and password to log in.',
          user: {
            userId,
            studentId,
            name: name.trim(),
            role: 'student',
            studentCode,
            email: email.trim().toLowerCase(),
          },
        });
      });
    } catch (err) {
      if (conn) {
        try { await conn.rollback(); } catch (_) {}
        conn.release();
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email or Student ID already registered.' });
      }
      console.error('Signup error:', err.message);
      res.status(500).json({ error: err.message || 'Signup failed.' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ER: USERS for auth only. login_id = student_code (Student/Guardian) or staff_id (Staff) or ADMIN (hardcoded).
// Admin: hardcoded ADMIN / ADMIN@10. Student/Guardian: lookup USERS by login_id, verify password_hash; link to STUDENT.
// ---------------------------------------------------------------------------
router.post(
  '/login',
  [
    body('student_id').trim().notEmpty().withMessage('Student ID / login_id is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
    body('role').trim().notEmpty().withMessage('Role is required.').isIn(['student', 'guardian', 'admin']).withMessage('Invalid role.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { student_id: inputLoginId, password, role } = req.body;
    const roleLower = (role || '').toString().toLowerCase();

    // Admin: hardcoded only (demo / academic)
    if (roleLower === 'admin') {
      if (!isAdminLogin(inputLoginId, password)) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
      req.session.userId = 0;
      req.session.studentId = null;
      req.session.name = 'Admin';
      req.session.role = 'admin';
      req.session.studentCode = null;
      req.session.email = null;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Login failed.' });
        }
        res.json({ message: 'Login successful', user: { userId: 0, name: 'Admin', role: 'admin' } });
      });
      return;
    }

    // Student / Guardian: USERS.login_id = student_code; password in USERS.password_hash
    const loginId = String(inputLoginId).trim().toUpperCase();
    try {
      const [userRows] = await db.execute(
        'SELECT user_id, login_id, password_hash, password FROM users WHERE login_id = ?',
        [loginId]
      );
      if (userRows.length === 0) {
        return res.status(401).json({ error: 'Invalid Student ID or password.' });
      }
      const user = userRows[0];
      const hash = user.password_hash || user.password;
      if (!hash) {
        return res.status(401).json({ error: 'Invalid Student ID or password.' });
      }
      const match = await bcrypt.compare(password, hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid Student ID or password.' });
      }
      // Link to STUDENT (ER: one USERS row per student; Guardian uses same student_id)
      const [studentRows] = await db.execute('SELECT student_id, name, email FROM student WHERE student_code = ?', [loginId]);
      const student = studentRows[0];
      if (!student) {
        return res.status(401).json({ error: 'Student record not found.' });
      }
      req.session.userId = user.user_id;
      req.session.studentId = student.student_id;
      req.session.name = student.name || loginId;
      req.session.role = roleLower;
      req.session.studentCode = loginId;
      req.session.email = student.email || null;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Login failed.' });
        }
        res.json({
          message: 'Login successful',
          user: {
            userId: user.user_id,
            studentId: student.student_id,
            name: student.name || loginId,
            role: roleLower,
            studentCode: loginId,
            email: student.email,
          },
        });
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Login failed.' });
    }
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || req.session.role == null) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  res.json({
    userId: req.session.userId,
    studentId: req.session.studentId,
    email: req.session.email,
    name: req.session.name,
    role: (req.session.role || '').toString().toLowerCase(),
    studentCode: req.session.studentCode,
    linkedStudentId: req.session.role === 'guardian' ? req.session.studentId : null,
  });
});

module.exports = router;
