const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireLogin = require('../middleware/requireLogin');
const requireRole = require('../middleware/requireRole');

function capacityForRoomType(roomType) {
  const s = String(roomType || '').toLowerCase();
  if (s.includes('1-seater') || s === '1') return 1;
  if (s.includes('2-seater') || s === '2') return 2;
  if (s.includes('3-seater') || s === '3') return 3;
  return null;
}

// ER: session.studentId set at login (USERS → STUDENT link). Used for /me and other student data.
function getStudentIdForRequest(req) {
  if (req.session.role === 'student' || req.session.role === 'guardian') {
    return req.session.studentId != null ? req.session.studentId : null;
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
    let roommates = [];
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
    if (room && student.room_id) {
      const [occRows] = await db.execute(
        'SELECT COUNT(*) AS cnt FROM student WHERE room_id = ?',
        [student.room_id]
      );
      room.occupied = occRows[0]?.cnt ?? 0;
      if (room.capacity == null) {
        room.capacity = capacityForRoomType(room.room_type) ?? 3;
      }
      const [mateRows] = await db.execute(
        'SELECT student_id, name FROM student WHERE room_id = ? AND student_id != ? ORDER BY name',
        [student.room_id, studentId]
      );
      roommates = mateRows.map((m) => ({ student_id: m.student_id, name: m.name ?? '-' }));
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
      roommates: roommates,
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
