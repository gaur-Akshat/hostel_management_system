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

async function ensureTables() {
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'student', 'guardian') NOT NULL,
      linked_student_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createUsers);

  const createStudent = `
    CREATE TABLE IF NOT EXISTS student (
      student_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL UNIQUE,
      name VARCHAR(255) NULL,
      guardian_name VARCHAR(255) NULL,
      guardian_phone VARCHAR(20) NULL,
      room_id INT NULL
    )
  `;
  await pool.execute(createStudent);

  const createRoom = `
    CREATE TABLE IF NOT EXISTS room (
      room_id INT AUTO_INCREMENT PRIMARY KEY,
      room_no VARCHAR(50) NULL
    )
  `;
  await pool.execute(createRoom);

  const createFees = `
    CREATE TABLE IF NOT EXISTS fees (
      fee_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      amount DECIMAL(10,2) NULL
    )
  `;
  await pool.execute(createFees);

  const createAttendance = `
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      date DATE NULL,
      status VARCHAR(50) NULL
    )
  `;
  await pool.execute(createAttendance);
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
module.exports.ensureTables = ensureTables;