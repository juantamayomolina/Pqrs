const express = require('express');
const router = express.Router();
const { getUsuarioByDoc, getAgentes } = require('../controllers/usuario.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/buscar', getUsuarioByDoc);
router.get('/agentes', requireAuth, requireRole(['ADMIN']), getAgentes);

module.exports = router;
