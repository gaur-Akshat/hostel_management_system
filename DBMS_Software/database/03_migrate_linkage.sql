-- Migration: add app linkage columns to existing hostel_management schema.
-- Run once. If a column already exists, that statement will error (safe to ignore or run per-statement).

-- Users: name (for display), linked_student_id (for guardian → student link)
ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD COLUMN linked_student_id INT NULL AFTER role;

-- Student: user_id (link to users for student login)
ALTER TABLE student ADD COLUMN user_id INT NULL UNIQUE AFTER student_id;
