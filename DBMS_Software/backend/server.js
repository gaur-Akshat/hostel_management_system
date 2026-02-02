const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: allow frontend origin; credentials for session cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting: general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Stricter limit for auth (login/signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

app.use(express.json({ limit: '256kb' }));

// Session store: MySQL in production, memory fallback
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && isProduction) {
  console.warn('Warning: SESSION_SECRET not set in production. Set it in .env.');
}
const sessionConfig = {
  secret: sessionSecret || 'hostel-management-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
};
if (process.env.SESSION_STORE === 'mysql' || isProduction) {
  try {
    const store = new MySQLStore({}, db);
    sessionConfig.store = store;
  } catch (e) {
    console.warn('MySQL session store failed, using memory:', e.message);
  }
}
app.use(session(sessionConfig));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: isProduction ? 'Internal server error.' : err.message });
});

async function start() {
  await db.ensureDatabase();
  await db.ensureMigrations();
  await db.ensureTables();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
