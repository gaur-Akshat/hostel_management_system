-- =============================================
-- HOSTEL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- MySQL - Academic DBMS Project
-- =============================================
-- Prerequisite: Existing tables (student, staff, hostel, room, fees, attendance).
-- Run schema.sql after student table exists.
-- If your student table uses 'id' as primary key instead of 'student_id',
-- change REFERENCES student(student_id) to REFERENCES student(id) below.
-- Then run 02_student_alter.sql if student lacks user_id, guardian_name, guardian_phone.
-- =============================================

-- 1. USERS TABLE (Authentication)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student', 'guardian') NOT NULL,
  linked_student_id INT NULL COMMENT 'For guardian: student they can view',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_student_id) REFERENCES student(student_id) ON DELETE SET NULL
);
