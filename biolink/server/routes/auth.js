const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../utils/auth');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const REGISTRATION_TTL_MS = 15 * 60 * 1000; // 15 минут на подтверждение в боте

function generateCode(existingMap) {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingMap[code]);
  return code;
}

function normalizeTelegramHandle(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;            // числовой Telegram ID
  return value.replace(/^@/, '');                     // @username -> username
}

/* ---------- Шаг 1: сайт собирает логин/пароль/telegram, выдаёт код ---------- */

router.post('/register/start', (req, res) => {
  const { username, password, telegram } = req.body || {};

  if (!username || !password || !telegram) {
    return res.status(400).json({ error: 'Заполни логин, пароль и Telegram' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Логин: 3–20 символов, латиница/цифры/подчёркивание' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }

  const telegramHandle = normalizeTelegramHandle(telegram);
  if (!telegramHandle) {
    return res.status(400).json({ error: 'Укажи Telegram ID или username' });
  }

  const state = db.get();
  const usernameTaken = state.users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (usernameTaken) return res.status(400).json({ error: 'Этот логин уже занят' });

  bcrypt.hash(password, 10).then((passwordHash) => {
    const code = generateCode(state.pendingRegistrations);
    state.pendingRegistrations[code] = {
      username,
      passwordHash,
      telegramHandle,
      createdAt: Date.now(),
      expiresAt: Date.now() + REGISTRATION_TTL_MS
    };
    db.save();
    res.json({ code, ttlSeconds: REGISTRATION_TTL_MS / 1000 });
  });
});

/* ---------- Шаг 2: сайт поллит, пока бот не подтвердит регистрацию ---------- */

router.get('/register/claim/:code', (req, res) => {
  const state = db.get();
  const { code } = req.params;

  const claim = state.claims[code];
  if (claim) {
    if (claim.expiresAt < Date.now()) {
      delete state.claims[code];
      db.save();
      return res.json({ status: 'expired' });
    }
    delete state.claims[code];
    db.save();
    return res.json({ status: 'confirmed', token: claim.token, username: claim.username });
  }

  const pending = state.pendingRegistrations[code];
  if (pending) {
    if (pending.expiresAt < Date.now()) {
      delete state.pendingRegistrations[code];
      db.save();
      return res.json({ status: 'expired' });
    }
    return res.json({ status: 'pending' });
  }

  res.json({ status: 'expired' });
});

/* ---------- Вход ---------- */

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Заполни логин и пароль' });
  }

  const state = db.get();
  const user = state.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const token = signToken(user);
  res.json({ token, username: user.username });
});

/* ---------- Сброс пароля: код выдаёт бот командой /reset, здесь его вводят с новым паролем ---------- */

router.post('/reset/confirm', async (req, res) => {
  const { username, code, newPassword } = req.body || {};
  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: 'Заполни логин, код и новый пароль' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }

  const state = db.get();
  const entry = state.resetCodes[code];
  if (!entry) return res.status(400).json({ error: 'Код не найден. Запроси новый командой /reset в боте' });
  if (entry.expiresAt < Date.now()) {
    delete state.resetCodes[code];
    db.save();
    return res.status(400).json({ error: 'Код истёк. Запроси новый командой /reset в боте' });
  }

  const user = state.users.find((u) => u.id === entry.userId);
  if (!user || user.username.toLowerCase() !== username.toLowerCase()) {
    return res.status(400).json({ error: 'Этот код выдан для другого логина' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  delete state.resetCodes[code];
  db.save();
  res.json({ ok: true });
});

module.exports = router;
