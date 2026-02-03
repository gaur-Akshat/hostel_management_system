const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const requireLogin = require('../middleware/requireLogin');
const requireRole = require('../middleware/requireRole');

/**
 * POST /api/seed/demo
 * ER: Only 8 tables. Admin is hardcoded (not in DB). Inserts:
 * - STUDENT rows (student_code AH26-XXX, profile only)
 * - USERS rows (login_id = student_code, password_hash, role = student)
 * - ROOM rows (optional)
 * No registration_requests.
 */
router.post('/demo', requireLogin, requireRole('admin'), async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const demoStudents = [
      { name: 'Rahul Kumar', email: 'rahul.student@hostel.demo' },
      { name: 'Priya Sharma', email: 'priya.student@hostel.demo' },
      { name: 'Amit Singh', email: 'amit.student@hostel.demo' },
    ];
    const demoPassword = 'Student123!';
    const hashed = await bcrypt.hash(demoPassword, 10);

    for (const s of demoStudents) {
      const [existing] = await conn.execute('SELECT student_id FROM student WHERE email = ?', [s.email]);
      if (existing.length > 0) continue;

      const [maxRows] = await conn.execute(
        "SELECT student_code FROM student WHERE student_code LIKE 'AH26-%' ORDER BY student_id DESC LIMIT 1"
      );
      let nextNum = 101;
      if (maxRows.length > 0 && maxRows[0].student_code) {
        const match = maxRows[0].student_code.match(/AH26-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const studentCode = `AH26-${nextNum}`;

      await conn.execute(
        `INSERT INTO student (student_code, name, email, guardian_name, guardian_phone) VALUES (?, ?, ?, ?, ?)`,
        [studentCode, s.name, s.email, 'Guardian', null]
      );
      const studentId = (await conn.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;

      await conn.execute(
        'INSERT INTO users (login_id, password_hash, role) VALUES (?, ?, ?)',
        [studentCode, hashed, 'student']
      );
    }

    try {
      const [roomExists] = await conn.execute('SELECT room_id FROM room LIMIT 1');
      if (roomExists.length === 0) {
        try {
          await conn.execute(
            "INSERT INTO room (room_no, room_type, capacity) VALUES ('R-101', '1-Seater', 1), ('R-102', '2-Seater', 2), ('R-103', '3-Seater', 3)"
          );
        } catch (e) {
          await conn.execute("INSERT INTO room (room_no) VALUES ('R-101'), ('R-102')");
        }
      }
    } catch (e) {
      // ignore
    }

    await conn.commit();
    conn.release();
    res.json({
      message: 'Demo data loaded (STUDENT + USERS + ROOM). Admin login: ADMIN / ADMIN@10.',
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) {}
      conn.release();
    }
    console.error('Seed demo error:', err);
    res.status(500).json({ error: err.message || 'Failed to load demo data.' });
  }
});

module.exports = router;
