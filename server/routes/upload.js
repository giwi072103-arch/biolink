const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ACCEPTED = {
  background: {
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    maxBytes: 40 * 1024 * 1024
  },
  music: {
    mimes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'],
    maxBytes: 20 * 1024 * 1024
  }
};

function makeUploader(kind) {
  const config = ACCEPTED[kind];
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${kind}-${req.userId}-${nanoid(8)}${ext}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: config.maxBytes },
    fileFilter: (req, file, cb) => {
      if (!config.mimes.includes(file.mimetype)) {
        return cb(new Error('Неподдерживаемый тип файла'));
      }
      cb(null, true);
    }
  });
}

const uploadBackground = makeUploader('background');
const uploadMusic = makeUploader('music');

router.post('/background', requireAuth, (req, res) => {
  uploadBackground.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    const url = `/uploads/${req.file.filename}`;
    const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    res.json({ url, type });
  });
});

router.post('/music', requireAuth, (req, res) => {
  uploadMusic.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
