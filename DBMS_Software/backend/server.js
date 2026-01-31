const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow frontend origin so browser accepts responses; credentials: true for session cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
// Parse JSON body for POST/PUT
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'hostel-management-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  await db.ensureDatabase();
  await db.ensureTables();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
