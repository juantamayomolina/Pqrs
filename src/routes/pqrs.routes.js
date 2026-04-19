const { Router } = require('express');
const { crearSolicitud, obtenerSolicitud } = require('../controllers/pqrs.controller');

const router = Router();

// POST /api/pqrs
router.post('/', crearSolicitud);

// GET /api/pqrs/:radicado
router.get('/:radicado', obtenerSolicitud);

module.exports = router;
