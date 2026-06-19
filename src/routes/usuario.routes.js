const express = require('express');
const router = express.Router();
const { getUsuarioByDoc, getAgentes, getAssignees, getUsuarios, createUsuario, updateUsuario, toggleUsuarioActivo } = require('../controllers/usuario.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/buscar', getUsuarioByDoc);
router.get('/agentes', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR']), getAgentes);
router.get('/asignables', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'GESTOR']), getAssignees);

// CRUD Administrativo
router.get('/', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), getUsuarios);
router.post('/', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), createUsuario);
router.put('/:id', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), updateUsuario);
router.put('/:id/toggle-activo', requireAuth, requireRole(['SUPERADMIN', 'ADMIN']), toggleUsuarioActivo);

module.exports = router;
