// Точка входа для хранилища данных. По умолчанию — JSON-файл (см. db-json.js), это
// осознанный выбор проекта (см. README): без нативных зависимостей — стабильно собирается
// в Termux и на Railway. Если хочется настоящую SQL-базу — поставь в .env:
//   DB_DRIVER=sqlite
// и один раз выполни `npm install better-sqlite3` (пакет не входит в обязательные
// зависимости именно для того, чтобы `npm install` из коробки не падал там, где
// нативные модули не собираются).
const driver = (process.env.DB_DRIVER || 'json').toLowerCase();

module.exports = driver === 'sqlite'
  ? require('./db-sqlite')
  : require('./db-json');
