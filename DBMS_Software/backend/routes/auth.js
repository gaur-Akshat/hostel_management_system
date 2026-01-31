const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, linked_student_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    const userRole = role || 'student';
    if (!['admin', 'student', 'guardian'].includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, linked_student_id) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, userRole, userRole === 'guardian' ? linked_student_id || null : null]
    );
    const userId = result.insertId;
    if (userRole === 'student') {
      await db.execute(
        'INSERT INTO student (user_id, name) VALUES (?, ?)',
        [userId, name.trim()]
      );
    }
    const [rows] = await db.execute(
      'SELECT user_id, email, name, role, linked_student_id FROM users WHERE user_id = ?',
      [userId]
    );
    const user = rows[0];
    const roleLower = (user.role || '').toString().toLowerCase();
    req.session.userId = user.user_id;
    req.session.email = user.email;
    req.session.name = user.name;
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
          name: user.name,
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
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
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
    req.session.userId = user.user_id;
    req.session.email = user.email;
    req.session.name = user.name;
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
          name: user.name,
          role: roleLower,
          linkedStudentId: user.linked_student_id,
        },
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

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
