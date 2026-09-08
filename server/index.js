require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const { createBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);

// публичная страница пользователя: /u/anvarbek
app.get('/u/:username', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'u.html'));
});

app.listen(PORT, () => {
  console.log(`biolink запущен на порту ${PORT}`);
});

if (process.env.BOT_TOKEN) {
  const bot = createBot(process.env.BOT_TOKEN);
  bot.launch();
  console.log('Telegram-бот запущен');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.warn('BOT_TOKEN не задан — регистрация через Telegram недоступна, пока не добавишь его в .env');
}
