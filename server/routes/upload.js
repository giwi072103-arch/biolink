const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Максимум можно переопределить через .env (MAX_UPLOAD_MB), по умолчанию — 100МБ.
const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 100) * 1024 * 1024;

// iOS/Safari часто отдаёт для одного и того же файла разные (или пустые/generic) MIME-типы —
// особенно для файлов, выбранных из "Файлы"/iCloud или экспортированных из других приложений.
// Поэтому валидируем и по MIME, и по расширению: файл принимается, если совпадает хоть один список.
const ACCEPTED = {
  avatar: {
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif'],
    maxBytes: MAX_UPLOAD_BYTES
  },
  background: {
    mimes: [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ],
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.mp4', '.webm', '.mov'],
    maxBytes: MAX_UPLOAD_BYTES
  },
  music: {
    mimes: [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/oga',
      'audio/x-m4a', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-flac',
      'audio/webm', 'audio/x-caf', 'audio/3gpp', 'application/octet-stream'
    ],
    exts: ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.mp4', '.aac', '.flac', '.webm', '.caf', '.3gp'],
    maxBytes: MAX_UPLOAD_BYTES
  }
};

function isAccepted(kind, file) {
  const config = ACCEPTED[kind];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeOk = config.mimes.includes((file.mimetype || '').toLowerCase());
  const extOk = config.exts.includes(ext);
  // application/octet-stream разрешаем ТОЛЬКО если хотя бы расширение похоже на нужный тип —
  // иначе через эту лазейку можно было бы залить что угодно.
  if ((file.mimetype || '').toLowerCase() === 'application/octet-stream') return extOk;
  return mimeOk || extOk;
}

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
      if (!isAccepted(kind, file)) {
        return cb(new Error('Неподдерживаемый тип файла'));
      }
      cb(null, true);
    }
  });
}

const uploadAvatar = makeUploader('avatar');
const uploadBackground = makeUploader('background');
const uploadMusic = makeUploader('music');

function handleUploadErrors(err, res) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `Файл больше ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}МБ` });
  }
  return res.status(400).json({ error: err.message || 'Не удалось загрузить файл' });
}

router.post('/avatar', requireAuth, (req, res) => {
  uploadAvatar.single('file')(req, res, (err) => {
    if (err) return handleUploadErrors(err, res);
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/background', requireAuth, (req, res) => {
  uploadBackground.single('file')(req, res, (err) => {
    if (err) return handleUploadErrors(err, res);
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    const url = `/uploads/${req.file.filename}`;
    const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    res.json({ url, type });
  });
});

router.post('/music', requireAuth, (req, res) => {
  uploadMusic.single('file')(req, res, (err) => {
    if (err) return handleUploadErrors(err, res);
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
