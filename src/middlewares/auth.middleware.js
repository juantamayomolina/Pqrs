const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-pqrs';

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Acceso denegado. No se detectó token de autenticación.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, numeroDocumento, rol, nombreCompleto }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Permisos insuficientes para acceder a este recurso.' });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
