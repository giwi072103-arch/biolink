// Опциональное SQL-хранилище (SQLite) — включается через DB_DRIVER=sqlite в .env.
// По умолчанию проект по-прежнему использует data/db.json (server/db-json.js), потому что
// это надёжнее собирается в Termux/на слабом железе (без нативной компиляции).
// Если нужна настоящая БД (например, для последующей миграции на Postgres/MySQL) —
// этот драйвер хранит ровно то же самое состояние, но в файле data/db.sqlite,
// одной строкой в таблице key-value. Остальной код (routes/*) работает с db.get()/db.save()
// одинаково независимо от драйвера, так что переключение ничего не ломает.
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.sqlite');

const EMPTY_STATE = {
  users: [],
  pendingRegistrations: {},
  claims: {},
  resetCodes: {},
  profiles: {}
};

let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  throw new Error(
    'DB_DRIVER=sqlite требует пакет better-sqlite3 — установи его: npm install better-sqlite3'
  );
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const conn = new Database(DB_FILE);
conn.pragma('journal_mode = WAL');
conn.exec(`
  CREATE TABLE IF NOT EXISTS store (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  )
`);

const existingRow = conn.prepare('SELECT data FROM store WHERE id = 1').get();
let state;
if (existingRow) {
  state = JSON.parse(existingRow.data);
  for (const key of Object.keys(EMPTY_STATE)) {
    if (!(key in state)) state[key] = EMPTY_STATE[key];
  }
} else {
  state = { ...EMPTY_STATE };
  conn.prepare('INSERT INTO store (id, data) VALUES (1, ?)').run(JSON.stringify(state));
}

const upsert = conn.prepare(
  'INSERT INTO store (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data'
);

let writeScheduled = false;
function persist() {
  if (writeScheduled) return;
  writeScheduled = true;
  setImmediate(() => {
    upsert.run(JSON.stringify(state));
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
