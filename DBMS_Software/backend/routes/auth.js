const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const allowedSignupRoles = ['admin', 'student', 'guardian'];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join(' ');
    res.status(400).json({ error: msg });
    return true;
  }
  return false;
}

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }).withMessage('Name too long.'),
    body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role').optional().trim().isIn(allowedSignupRoles).withMessage('Invalid role.'),
    body('linked_student_id').optional().isInt({ min: 1 }).toInt(),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    let userId;
    let conn;
    try {
    try {
      conn = await db.getConnection();
      const { name, email, password, role, linked_student_id } = req.body;
      const userRole = (role || 'student').toString().toLowerCase();
      if (!allowedSignupRoles.includes(userRole)) {
        if (conn) conn.release();
        return res.status(400).json({ error: 'Invalid role.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await conn.beginTransaction();
      const [result] = await conn.execute(
        'INSERT INTO users (name, email, password, role, linked_student_id) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), email.trim().toLowerCase(), hashedPassword, userRole, userRole === 'guardian' ? linked_student_id || null : null]
      );
      userId = result.insertId;
      if (userRole === 'student') {
        try {
          await conn.execute(
            'INSERT INTO student (user_id, name) VALUES (?, ?)',
            [userId, name.trim()]
          );
        } catch (studentErr) {
          await conn.rollback();
          conn.release();
          if (studentErr.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ error: 'Database schema missing user_id on student table. Restart the server to run migrations.' });
          }
          console.error('Student insert error:', studentErr.message);
          return res.status(500).json({ error: 'Could not create student record. Try again or contact admin.' });
        }
      }
      await conn.commit();
    } catch (err) {
      if (conn && !conn._released) {
        try { await conn.rollback(); } catch (_) {}
      }
      throw err;
    } finally {
      if (conn && !conn._released) conn.release();
    }

    try {
      const [rows] = await db.execute(
        'SELECT user_id, email, name, role, linked_student_id FROM users WHERE user_id = ?',
        [userId]
      );
      const user = rows[0];
      const roleLower = (user.role || '').toString().toLowerCase();
      const displayName = user.name || user.email || '';
      req.session.userId = user.user_id;
      req.session.email = user.email;
      req.session.name = displayName;
      req.session.role = roleLower;
      req.session.linkedStudentId = user.linked_student_id || null;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Signup failed.' });
        }
        res.status(201).json({
          message: 'Signup successful.',
          user: {
            userId: user.user_id,
            email: user.email,
            name: displayName,
            role: roleLower,
            linkedStudentId: user.linked_student_id,
          },
        });
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      console.error('Signup error:', err.message);
      res.status(500).json({ error: err.code === 'ER_NO_SUCH_TABLE' ? 'Database not ready. Restart the server.' : 'Signup failed.' });
    }
    } catch (outerErr) {
      if (outerErr.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      console.error('Signup error:', outerErr.message);
      res.status(500).json({ error: 'Signup failed.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return; // login
    try {
      const { email, password, role } = req.body;
      const [rows] = await db.execute(
        'SELECT user_id, email, password, name, role, linked_student_id FROM users WHERE email = ?',
        [email.trim().toLowerCase()]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const roleLower = (user.role || '').toString().toLowerCase();
      const requestedRole = (role || '').toString().toLowerCase();
      if (requestedRole && roleLower !== requestedRole) {
        return res.status(403).json({ error: 'Wrong role selected. Please select your correct role.' });
      }
      const displayName = user.name || user.email || '';
      req.session.userId = user.user_id;
      req.session.email = user.email;
      req.session.name = displayName;
      req.session.role = roleLower;
      req.session.linkedStudentId = user.linked_student_id || null;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Login failed.' });
        }
        res.json({
          message: 'Login successful',
          user: {
            userId: user.user_id,
            email: user.email,
            name: displayName,
            role: roleLower,
            linkedStudentId: user.linked_student_id,
          },
        });
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: err.message || 'Login failed.' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

// GET /api/auth/me (current user - for frontend)
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  const role = (req.session.role || '').toString().toLowerCase();
  res.json({
    userId: req.session.userId,
    email: req.session.email,
    name: req.session.name,
    role,
    linkedStudentId: req.session.linkedStudentId,
  });
});

module.exports = router;
