const { Telegraf } = require('telegraf');
const { nanoid } = require('nanoid');
const db = require('./db');
const { signToken } = require('./utils/auth');
const defaultProfile = require('./utils/defaultProfile');

const CLAIM_TTL_MS = 5 * 60 * 1000;   // сколько сайт может забирать токен после подтверждения
const RESET_TTL_MS = 15 * 60 * 1000;  // сколько живёт код сброса пароля

function generateCode(existingMap) {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingMap[code]);
  return code;
}

function createBot(token) {
  const bot = new Telegraf(token);
  const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  function confirmRegistration(ctx, rawCode) {
    const code = String(rawCode || '').trim();
    const state = db.get();
    const pending = state.pendingRegistrations[code];

    if (!pending) {
      return ctx.reply('Такой код не найден — возможно, он уже использован. Вернись на сайт и попробуй заново.');
    }
    if (pending.expiresAt < Date.now()) {
      delete state.pendingRegistrations[code];
      db.save();
      return ctx.reply('Код истёк. Вернись на сайт и запроси новый.');
    }

    const alreadyTaken = state.users.some(
      (u) => u.username.toLowerCase() === pending.username.toLowerCase()
    );
    if (alreadyTaken) {
      delete state.pendingRegistrations[code];
      db.save();
      return ctx.reply('Этот логин уже кто-то занял, пока код был активен. Вернись на сайт и выбери другой.');
    }

    const user = {
      id: nanoid(12),
      username: pending.username,
      passwordHash: pending.passwordHash,
      telegramId: ctx.from.id,
      telegramUsername: ctx.from.username || null,
      telegramHandleDeclared: pending.telegramHandle,
      createdAt: Date.now()
    };

    state.users.push(user);
    state.profiles[user.id] = defaultProfile(user.username);
    delete state.pendingRegistrations[code];

    const token = signToken(user);
    state.claims[code] = { token, username: user.username, expiresAt: Date.now() + CLAIM_TTL_MS };
    db.save();

    const mismatch = pending.telegramHandle && !/^\d+$/.test(pending.telegramHandle)
      && ctx.from.username
      && pending.telegramHandle.toLowerCase() !== ctx.from.username.toLowerCase();

    let text = `Готово! Аккаунт @${user.username} подтверждён и привязан к этому Telegram.\nВозвращайся во вкладку с сайтом — вход произойдёт автоматически.`;
    if (mismatch) {
      text += `\n\n(На заметку: при регистрации был указан @${pending.telegramHandle}, а подтвердил @${ctx.from.username} — если это не ты, срочно смени пароль.)`;
    }
    ctx.reply(text);
  }

  function handleReset(ctx) {
    const state = db.get();
    const user = state.users.find((u) => u.telegramId === ctx.from.id);
    if (!user) {
      return ctx.reply('К этому Telegram-аккаунту не привязан ни один профиль biolink.');
    }

    const code = generateCode(state.resetCodes);
    state.resetCodes[code] = { userId: user.id, expiresAt: Date.now() + RESET_TTL_MS };
    db.save();

    ctx.reply(
      `Код для сброса пароля: ${code}\n` +
      `Аккаунт: @${user.username}\n\n` +
      `Введи его вместе с новым паролем здесь (код живёт 15 минут):\n${siteUrl}/reset.html`
    );
  }

  bot.start((ctx) => {
    const payload = ctx.startPayload || '';
    if (payload.startsWith('confirm_')) {
      return confirmRegistration(ctx, payload.slice('confirm_'.length));
    }
    ctx.reply(
      'Привет! Это бот для biolink.\n\n' +
      '• Регистрацию начинай на сайте — он приведёт тебя сюда с готовым кодом.\n' +
      '• Забыл пароль — команда /reset.'
    );
  });

  bot.command('confirm', (ctx) => {
    const code = ctx.message.text.split(' ')[1];
    if (!code) return ctx.reply('Использование: /confirm 123456');
    confirmRegistration(ctx, code);
  });

  bot.command('reset', handleReset);

  bot.catch((err) => {
    console.error('Ошибка Telegram-бота:', err);
  });

  return bot;
}

module.exports = { createBot };
