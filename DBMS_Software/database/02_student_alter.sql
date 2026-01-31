-- =============================================
-- Link student to users and add guardian columns
-- Run ONLY if student table does NOT have these columns.
-- If you get "Duplicate column name", skip that ALTER.
-- =============================================

-- Add user_id (FK to users)
ALTER TABLE student ADD COLUMN user_id INT NULL UNIQUE;
ALTER TABLE student ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Add guardian fields (stored in student table; no guardian table)
ALTER TABLE student ADD COLUMN guardian_name VARCHAR(255) NULL;
ALTER TABLE student ADD COLUMN guardian_phone VARCHAR(20) NULL;
