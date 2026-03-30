const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function sanitizeRelativePath(input = '') {
  const normalized = path.posix
    .normalize(String(input).replace(/\\/g, '/'))
    .replace(/^\/+/, '')
    .replace(/^(\.\.\/)+/, '');

  return normalized === '.' ? '' : normalized;
}

function getRequestedPath(req) {
  return sanitizeRelativePath(typeof req.query.path === 'string' ? req.query.path : '');
}

// Ensure upload directories exist
const UPLOAD_BASE = path.join(__dirname, '..', 'uploads');
const BUCKETS = ['cms-images', 'products', 'quote-attachments'];
BUCKETS.forEach(b => {
  const dir = path.join(UPLOAD_BASE, b);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = req.params.bucket || 'cms-images';
    const requestedPath = getRequestedPath(req);
    const subPath = requestedPath ? path.posix.dirname(requestedPath) : '';
    const dir = path.join(UPLOAD_BASE, bucket, subPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    req.uploadDir = dir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const requestedPath = getRequestedPath(req);
    const hintedName = requestedPath ? path.posix.basename(requestedPath) : '';

    if (hintedName) {
      const originalExt = path.extname(file.originalname).toLowerCase();
      const hintedExt = path.extname(hintedName).toLowerCase();
      const ext = hintedExt || originalExt;
      const baseName = path
        .basename(hintedName, hintedExt)
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `file-${Date.now()}`;

      const uploadDir = req.uploadDir || path.join(UPLOAD_BASE, req.params.bucket || 'cms-images');
      const preferredName = `${baseName}${ext}`;
      const finalName = fs.existsSync(path.join(uploadDir, preferredName))
        ? `${baseName}-${Date.now()}${ext}`
        : preferredName;

      return cb(null, finalName);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    return cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

// POST /api/upload/:bucket — upload file, return public URL
// Query param: ?path=hero-slides/image.jpg (optional subdirectory/name hint)
router.post('/:bucket', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const bucket = req.params.bucket;
  const relativePath = path.relative(UPLOAD_BASE, req.file.path).replace(/\\/g, '/');
  const publicUrl = `/uploads/${relativePath}`;

  res.json({ publicUrl, path: relativePath });
});

// POST /api/upload/public/:bucket — public upload (quote attachments)
router.post('/public/:bucket', upload.single('file'), (req, res) => {
  if (req.params.bucket !== 'quote-attachments') {
    return res.status(403).json({ error: 'Public upload only allowed for quote-attachments' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const relativePath = path.relative(UPLOAD_BASE, req.file.path).replace(/\\/g, '/');
  res.json({ path: relativePath });
});

module.exports = router;
