const express = require('express');
const router = express.Router();
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/area.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Todas las rutas de áreas estarán protegidas para SUPERADMIN y ADMIN
router.use(requireAuth);
router.use(requireRole(['SUPERADMIN', 'ADMIN']));

router.get('/', getAreas);
router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);

module.exports = router;
