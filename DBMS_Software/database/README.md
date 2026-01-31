# Database Setup

1. Create a MySQL database: `CREATE DATABASE hostel_db; USE hostel_db;`
2. Ensure your existing tables exist: student, staff, hostel, room, fees, attendance.
3. Run `schema.sql` - if you get "Duplicate column" on ALTER TABLE student, those columns already exist; run only the CREATE TABLE users and the ALTERs that don't fail.
