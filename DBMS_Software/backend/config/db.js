const mysql = require('mysql2/promise');

const dbName = process.env.DB_NAME || 'hostel_db';

async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await conn.end();
}

/**
 * Add missing columns to align with ER diagram (8 tables only).
 * USERS: auth only → login_id, password_hash, role. STUDENT: profile only → student_code (AH26-XXX).
 * Idempotent; does not add new tables.
 */
async function ensureMigrations() {
  const conn = await pool.getConnection();
  try {
    const [cols] = await conn.execute(
      "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'student')",
      [dbName]
    );
    const has = (table, column) => cols.some((r) => r.TABLE_NAME === table && r.COLUMN_NAME === column);
    // USERS: login_id for ID-based auth (student_code / staff_id / admin) — ER: USERS for auth only
    if (!has('users', 'login_id')) {
      await conn.execute('ALTER TABLE users ADD COLUMN login_id VARCHAR(50) NULL UNIQUE');
    }
    if (!has('users', 'password_hash')) {
      await conn.execute('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL');
    }
    // STUDENT: student_code (AH26-XXX) for display/login link; ER keeps student_id as PK for FKs
    if (!has('student', 'student_code')) {
      await conn.execute('ALTER TABLE student ADD COLUMN student_code VARCHAR(20) NULL UNIQUE');
    }
    if (!has('student', 'gender')) {
      await conn.execute('ALTER TABLE student ADD COLUMN gender VARCHAR(20) NULL');
    }
    if (!has('student', 'phone')) {
      await conn.execute('ALTER TABLE student ADD COLUMN phone VARCHAR(20) NULL');
    }
    if (!has('student', 'email')) {
      await conn.execute('ALTER TABLE student ADD COLUMN email VARCHAR(255) NULL');
    }
    if (!has('student', 'address')) {
      await conn.execute('ALTER TABLE student ADD COLUMN address VARCHAR(500) NULL');
    }
    if (!has('student', 'course')) {
      await conn.execute('ALTER TABLE student ADD COLUMN course VARCHAR(100) NULL');
    }
    if (!has('student', 'year')) {
      await conn.execute('ALTER TABLE student ADD COLUMN year INT NULL');
    }
    const [roomCols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'room'",
      [dbName]
    );
    const hasRoom = (col) => roomCols.some((r) => r.COLUMN_NAME === col);
    if (roomCols.length > 0 && !hasRoom('room_type')) {
      await conn.execute('ALTER TABLE room ADD COLUMN room_type VARCHAR(50) NULL');
    }
    if (roomCols.length > 0 && !hasRoom('capacity')) {
      await conn.execute('ALTER TABLE room ADD COLUMN capacity INT NULL');
    }
    const [feeCols] = await conn.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fees'",
      [dbName]
    );
    const hasFee = (col) => feeCols.some((r) => r.COLUMN_NAME === col);
    if (feeCols.length > 0 && !hasFee('payment_date')) {
      await conn.execute('ALTER TABLE fees ADD COLUMN payment_date DATE NULL');
    }
    if (feeCols.length > 0 && !hasFee('payment_status')) {
      await conn.execute('ALTER TABLE fees ADD COLUMN payment_status VARCHAR(20) NULL');
    }
    if (feeCols.length > 0 && !hasFee('status')) {
      await conn.execute('ALTER TABLE fees ADD COLUMN status VARCHAR(20) NULL');
    }
  } finally {
    conn.release();
  }
}

/**
 * Create exactly 8 tables per ER diagram: HOSTEL, ROOM, STUDENT, STAFF, FEES, ATTENDANCE, ROOM_ALLOCATION, USERS.
 * No registration_requests or other extra tables.
 */
async function ensureTables() {
  // 1. HOSTEL (ER)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS hostel (
      hostel_id INT AUTO_INCREMENT PRIMARY KEY,
      hostel_name VARCHAR(50) NULL,
      location VARCHAR(50) NULL,
      total_rooms INT NULL
    )
  `);

  // 2. ROOM (ER: room.hostel_id → hostel)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS room (
      room_id INT AUTO_INCREMENT PRIMARY KEY,
      room_no VARCHAR(50) NULL,
      room_number VARCHAR(10) NULL,
      room_type VARCHAR(50) NULL,
      capacity INT NULL,
      hostel_id INT NULL
    )
  `);

  // 3. STUDENT (ER: primary entity; student.room_id → room)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS student (
      student_id INT AUTO_INCREMENT PRIMARY KEY,
      student_code VARCHAR(20) NULL UNIQUE,
      name VARCHAR(255) NULL,
      gender VARCHAR(20) NULL,
      phone VARCHAR(20) NULL,
      email VARCHAR(255) NULL,
      address VARCHAR(500) NULL,
      course VARCHAR(100) NULL,
      year INT NULL,
      guardian_name VARCHAR(255) NULL,
      guardian_phone VARCHAR(20) NULL,
      room_id INT NULL
    )
  `);

  // 4. STAFF (ER: staff.hostel_id → hostel)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      staff_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NULL,
      role VARCHAR(30) NULL,
      phone VARCHAR(15) NULL,
      salary DECIMAL(10,2) NULL,
      hostel_id INT NULL
    )
  `);

  // 5. FEES (ER: fees.student_id → student)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS fees (
      fee_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      amount DECIMAL(10,2) NULL,
      payment_date DATE NULL,
      payment_status VARCHAR(20) NULL,
      fee_type VARCHAR(20) NULL,
      period VARCHAR(20) NULL,
      status VARCHAR(20) NULL
    )
  `);

  // 6. ATTENDANCE (ER: attendance.student_id → student)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      date DATE NULL,
      status VARCHAR(50) NULL
    )
  `);

  // 7. ROOM_ALLOCATION (ER: room_allocation.student_id → student, room_allocation.room_id → room)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS room_allocation (
      allocation_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      room_id INT NULL,
      allocation_date DATE NULL
    )
  `);

  // 8. USERS (ER: auth only — login_id, password_hash, role; no business data)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      login_id VARCHAR(50) NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      role VARCHAR(20) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
module.exports.ensureDatabase = ensureDatabase;
module.exports.ensureMigrations = ensureMigrations;
module.exports.ensureTables = ensureTables;
