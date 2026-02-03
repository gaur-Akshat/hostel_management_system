const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireLogin = require('../middleware/requireLogin');
const requireRole = require('../middleware/requireRole');

// No-auth check so frontend can verify API is loaded (ER: no registration_requests table)
router.get('/ping', (req, res) => res.json({ ok: true }));

// ER: session.studentId set at login (USERS → STUDENT link). Used for FEES, ROOM_ALLOCATION, STUDENT.room_id
function getStudentIdForSession(req) {
  if (req.session.role !== 'student') return null;
  return req.session.studentId != null ? req.session.studentId : null;
}

function capacityForRoomType(roomType) {
  const s = String(roomType || '').toLowerCase();
  if (s.includes('1-seater') || s === '1') return 1;
  if (s.includes('2-seater') || s === '2') return 2;
  if (s.includes('3-seater') || s === '3') return 3;
  return 3;
}

// FEES table: fee_id, student_id, amount, payment_date, payment_status, fee_type, period, status
// fee_id may not be AUTO_INCREMENT; provide it explicitly when needed
async function recordPaidFee(conn, studentId, amount) {
  const [[row]] = await conn.execute('SELECT COALESCE(MAX(fee_id), 0) + 1 AS nextId FROM fees');
  const nextFeeId = row?.nextId ?? 1;
  await conn.execute(
    `INSERT INTO fees (fee_id, student_id, amount, payment_date, payment_status, fee_type, period, status)
     VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
    [nextFeeId, studentId, amount, 'PAID', 'YEARLY', 'year', 'PAID']
  );
}

/**
 * POST /api/registration/pay-and-book
 * ER: Only 8 tables. No admin approval. Student selects room type → backend:
 * 1) Insert FEES (PAID). 2) Find available ROOM. 3) Insert ROOM_ALLOCATION. 4) Update STUDENT.room_id.
 */
router.post('/pay-and-book', requireLogin, requireRole('student'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const studentId = getStudentIdForSession(req);
    if (!studentId) {
      conn.release();
      return res.status(400).json({ error: 'No student record. Please sign up first.' });
    }
    const { roomType, amount } = req.body;
    const price = amount != null ? Number(amount) : 0;
    if (!roomType || isNaN(price) || price <= 0) {
      conn.release();
      return res.status(400).json({ error: 'Room type and amount are required.' });
    }
    const roomTypeStr = String(roomType).trim();
    const capacity = capacityForRoomType(roomTypeStr);

    await conn.beginTransaction();

    // 1) ER: FEES — record PAID (simulated payment)
    try {
      await recordPaidFee(conn, studentId, price);
    } catch (e) {
      await conn.rollback();
      conn.release();
      console.error('Pay-and-book: fee insert failed', e.code, e.sqlMessage || e.message, e.sql);
      return res.status(500).json({ error: 'Failed to record fee.' });
    }

    // 2) ER: ROOM — find available room (occupancy < capacity)
    let roomId = null;
    let roomNo = null;
    const [roomCols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'room'"
    );
    const roomColNames = (roomCols || []).map((c) => c.COLUMN_NAME);
    const hasRoomNo = roomColNames.some((c) => c === 'room_no');
    const hasRoomNumber = roomColNames.some((c) => c === 'room_number');
    const roomNoCol = hasRoomNo ? 'room_no' : hasRoomNumber ? 'room_number' : null;
    const hasRoomType = roomColNames.some((c) => c === 'room_type');
    const hasCapacity = roomColNames.some((c) => c === 'capacity');
    const roomSelectBase = roomNoCol
      ? `SELECT r.room_id, r.${roomNoCol} AS room_no, (SELECT COUNT(*) FROM student s WHERE s.room_id = r.room_id) AS occupied FROM room r`
      : `SELECT r.room_id, (SELECT COUNT(*) FROM student s WHERE s.room_id = r.room_id) AS occupied FROM room r`;

    // Prefer rooms matching room_type; use HAVING occupied < ? (no r.capacity — works even if column missing)
    if (hasRoomType) {
      const [rooms] = await conn.execute(
        `${roomSelectBase} WHERE (r.room_type = ? OR r.room_type IS NULL) HAVING occupied < ? ORDER BY occupied ASC LIMIT 1`,
        [roomTypeStr, capacity]
      );
      if (rooms.length > 0) {
        roomId = rooms[0].room_id;
        roomNo = rooms[0].room_no ?? rooms[0].room_number ?? `R-${rooms[0].room_id}`;
      }
    }
    if (roomId == null) {
      const [allRooms] = await conn.execute(
        `${roomSelectBase} HAVING occupied < ? ORDER BY occupied ASC LIMIT 1`,
        [capacity]
      );
      if (allRooms.length > 0) {
        roomId = allRooms[0].room_id;
        roomNo = allRooms[0].room_no ?? allRooms[0].room_number ?? `R-${allRooms[0].room_id}`;
      }
    }
    if (roomId == null) {
      roomNo = roomNo || `R-${Date.now().toString().slice(-4)}`;
      const insertCol = roomNoCol || 'room_no';
      const cols = [insertCol];
      const vals = [roomNo];
      if (hasRoomType) { cols.push('room_type'); vals.push(roomTypeStr); }
      if (hasCapacity) { cols.push('capacity'); vals.push(capacity); }
      const [ins] = await conn.execute(
        `INSERT INTO room (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        vals
      );
      roomId = ins.insertId;
    }

    // 3) ER: STUDENT.room_id
    await conn.execute('UPDATE student SET room_id = ? WHERE student_id = ?', [roomId, studentId]);

    // 4) ER: ROOM_ALLOCATION (student_id → student, room_id → room)
    await conn.execute(
      'INSERT INTO room_allocation (student_id, room_id, allocation_date) VALUES (?, ?, CURDATE())',
      [studentId, roomId]
    );

    await conn.commit();
    conn.release();
    res.json({
      room: { room_id: roomId, room_no: roomNo, room_type: roomTypeStr },
      feeStatus: 'PAID',
      message: 'Room booked and fee recorded. Redirecting to dashboard.',
    });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    conn.release();
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to pay and book room.' });
  }
});

module.exports = router;
