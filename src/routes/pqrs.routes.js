const { Router } = require('express');
const { crearSolicitud, obtenerSolicitud, getGestionPqrs, asignarPqrs } = require('../controllers/pqrs.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();

// POST /api/pqrs
router.post('/', crearSolicitud);

router.get('/gestion', requireAuth, requireRole(['ADMIN', 'AGENTE']), getGestionPqrs);
router.put('/:id/asignar', requireAuth, requireRole(['ADMIN']), asignarPqrs);

// GET /api/pqrs/:radicado
router.get('/:radicado', obtenerSolicitud);

module.exports = router;
