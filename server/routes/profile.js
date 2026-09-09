const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Только эти ключи верхнего уровня клиент может перезаписывать целиком
const ALLOWED_KEYS = ['displayName', 'bio', 'avatarUrl', 'background', 'theme', 'socials', 'music', 'layout'];

router.get('/me', requireAuth, (req, res) => {
  const state = db.get();
  const profile = state.profiles[req.userId];
  if (!profile) return res.status(404).json({ error: 'Профиль не найден' });
  res.json({ username: req.username, profile });
});

router.put('/me', requireAuth, (req, res) => {
  const state = db.get();
  const profile = state.profiles[req.userId];
  if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

  const updates = req.body || {};
  for (const key of ALLOWED_KEYS) {
    if (key in updates) profile[key] = updates[key];
  }
  db.save();
  res.json({ profile });
});

router.get('/:username', (req, res) => {
  const state = db.get();
  const user = state.users.find(
    (u) => u.username.toLowerCase() === req.params.username.toLowerCase()
  );
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const profile = state.profiles[user.id];
  res.json({ username: user.username, profile });
});

module.exports = router;
