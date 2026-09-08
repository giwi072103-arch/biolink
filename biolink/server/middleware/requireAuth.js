const { verifyToken } = require('../utils/auth');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Нет токена авторизации' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Токен недействителен или истёк' });

  req.userId = payload.uid;
  req.username = payload.username;
  next();
};
