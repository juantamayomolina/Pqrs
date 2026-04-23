const express = require('express');
const router = express.Router();
const { getUsuarioByDoc, getAgentes } = require('../controllers/usuario.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/buscar', getUsuarioByDoc);
router.get('/agentes', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR']), getAgentes);
router.get('/asignables', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR']), getAssignees);

module.exports = router;
