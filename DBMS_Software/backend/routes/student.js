const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireLogin = require('../middleware/requireLogin');
const requireRole = require('../middleware/requireRole');

// Get student ID for current user (student role: by user_id; guardian: by linked_student_id)
async function getStudentIdForRequest(req) {
  if (req.session.role === 'student') {
    const [rows] = await db.execute('SELECT student_id FROM student WHERE user_id = ?', [req.session.userId]);
    return rows.length ? rows[0].student_id : null;
  }
  if (req.session.role === 'guardian') {
    return req.session.linkedStudentId || null;
  }
  return null;
}

// GET /api/student/me - Own profile, room, fees, attendance (Student or Guardian)
router.get('/me', requireLogin, requireRole('student', 'guardian'), async (req, res) => {
  try {
    const studentId = await getStudentIdForRequest(req);
    if (!studentId) {
      return res.status(404).json({
        error: req.session.role === 'guardian'
          ? 'No student linked to your account.'
          : 'No student record linked to your account.',
      });
    }
    const [studentRows] = await db.execute(
      'SELECT * FROM student WHERE student_id = ?',
      [studentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const student = studentRows[0];
    let room = null;
    let fees = [];
    let attendance = [];
    try {
      const [roomRows] = await db.execute(
        'SELECT r.* FROM room r INNER JOIN student s ON s.room_id = r.room_id WHERE s.student_id = ?',
        [studentId]
      );
      if (roomRows.length) room = roomRows[0];
    } catch (e) {
      try {
        if (student.room_id) {
          const [roomRows] = await db.execute('SELECT * FROM room WHERE room_id = ?', [student.room_id]);
          if (roomRows.length) room = roomRows[0];
        }
      } catch (e2) {
        // room table may not exist or have different schema
      }
    }
    try {
      const [feeRows] = await db.execute('SELECT * FROM fees WHERE student_id = ? ORDER BY fee_id DESC LIMIT 20', [studentId]);
      fees = feeRows;
    } catch (e) {
      // fees table might use different column name
    }
    try {
      const [attRows] = await db.execute('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30', [studentId]);
      attendance = attRows;
    } catch (e) {
      // attendance table might use different column name
    }
    res.json({
      student,
      room,
      fees,
      attendance,
      readOnly: req.session.role === 'guardian',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

// GET /api/student/list - Admin only: list all students
router.get('/list', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM student ORDER BY student_id');
    res.json({ students: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// GET /api/student/:id - Admin or Guardian (own linked) or Student (own)
router.get('/:id', requireLogin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid student ID.' });
    if (req.session.role === 'admin') {
      const [rows] = await db.execute('SELECT * FROM student WHERE student_id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
      return res.json(rows[0]);
    }
    const allowedId = await getStudentIdForRequest(req);
    if (allowedId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const [rows] = await db.execute('SELECT * FROM student WHERE student_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student.' });
  }
});

module.exports = router;
