const { Router } = require('express');
const { crearSolicitud, obtenerSolicitud, getGestionPqrs, asignarPqrs, emitirRespuesta, aportarInformacion } = require('../controllers/pqrs.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();

// POST /api/pqrs
router.post('/', crearSolicitud);

router.get('/gestion', requireAuth, requireRole(['ADMIN', 'AGENTE', 'SUPERADMIN', 'GESTOR']), getGestionPqrs);
router.put('/:id/asignar', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR']), asignarPqrs);

router.post('/:id/respuesta', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR', 'AGENTE']), emitirRespuesta);
router.post('/aportar/:radicado', aportarInformacion);

// GET /api/pqrs/:radicado
router.get('/:radicado', obtenerSolicitud);

module.exports = router;
