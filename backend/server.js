const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: true,
});

const pool = require('./db');

const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');
const uploadRoutes = require('./routes/upload');
const quoteGenRoutes = require('./routes/generateQuote');
const sendQuoteEmailRoutes = require('./routes/sendQuoteEmail');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', crudRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/generate-quote', quoteGenRoutes);
app.use('/api/send-quote-email', sendQuoteEmailRoutes);

// ── Serve frontend (production) ─────────────────────────────
const frontendDist = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbName = process.env.DB_NAME || 'smtrade_db';
  console.log(`🗄️ DB target ${dbHost}:${dbPort}/${dbName}`);
  console.log(`✅ SM Trade API running on port ${PORT}`);
});
