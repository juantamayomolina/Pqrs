const express = require('express');
const router = express.Router();
const {
  getTiposActivos,
  getTiposAdmin,
  crearTipoPqrs,
  actualizarTipoPqrs,
  toggleEstadoTipoPqrs
} = require('../controllers/tipoPqrs.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Endpoint público para el formulario de radicación
router.get('/', getTiposActivos);

// Endpoints administrativos protegidos
router.get('/admin', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), getTiposAdmin);
router.post('/', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), crearTipoPqrs);
router.put('/:id', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), actualizarTipoPqrs);
router.patch('/:id/toggle', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), toggleEstadoTipoPqrs);

module.exports = router;
