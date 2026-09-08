const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY_STATE = {
  users: [],                 // { id, username, passwordHash, telegramId, telegramUsername, telegramHandleDeclared, createdAt }
  pendingRegistrations: {},  // { code: { username, passwordHash, telegramHandle, expiresAt } } — до подтверждения в боте
  claims: {},                // { code: { token, username, expiresAt } } — сайт забирает токен после подтверждения ботом
  resetCodes: {},            // { code: { userId, expiresAt } } — сброс пароля, код выдаёт бот
  profiles: {}               // { [userId]: profileObject }
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_STATE, null, 2));
}

ensureFile();
let state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
// на случай апдейта с более старой версии базы — добираем недостающие разделы
for (const key of Object.keys(EMPTY_STATE)) {
  if (!(key in state)) state[key] = EMPTY_STATE[key];
}
delete state.codes; // из старого флоу регистрации, больше не используется
let writeScheduled = false;

function persist() {
  if (writeScheduled) return;
  writeScheduled = true;
  setImmediate(() => {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
    writeScheduled = false;
  });
}

module.exports = {
  get() {
    return state;
  },
  save() {
    persist();
  }
};
