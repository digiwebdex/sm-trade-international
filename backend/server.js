const express = require('express');
const cors = require('cors');
const fs = require('fs');
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
const translateRoutes = require('./routes/translate');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');

function resolveLegacyUpload(requestedPath) {
  const normalized = path.posix
    .normalize(String(requestedPath || '').replace(/\\/g, '/'))
    .replace(/^\/+/, '')
    .replace(/^(\.\.\/)+/, '');

  if (!normalized) return null;

  const exactPath = path.join(uploadsDir, normalized);
  if (fs.existsSync(exactPath)) return exactPath;

  const dir = path.dirname(exactPath);
  if (!fs.existsSync(dir)) return null;

  const ext = path.extname(exactPath).toLowerCase();
  const baseName = path.basename(exactPath, ext).toLowerCase();
  const timestamp = baseName.match(/\d{10,}/)?.[0];

  const matches = fs.readdirSync(dir).filter((fileName) => {
    if (path.extname(fileName).toLowerCase() !== ext) return false;
    const lower = fileName.toLowerCase();
    if (timestamp) return lower.includes(timestamp);
    return lower.includes(baseName);
  });

  return matches.length === 1 ? path.join(dir, matches[0]) : null;
}

app.use('/uploads', express.static(uploadsDir));
app.get(/^\/uploads\/(.+)$/, (req, res) => {
  const resolvedPath = resolveLegacyUpload(req.params[0]);
  if (resolvedPath) {
    return res.sendFile(resolvedPath);
  }

  return res.status(404).json({ error: 'File not found' });
});

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
app.use('/api/translate', translateRoutes);

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
