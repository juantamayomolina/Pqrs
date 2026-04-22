const express = require('express');
const router = express.Router();
const { getTablas, getRegistros, createRegistro, updateRegistro, deleteRegistro } = require('../controllers/superadmin.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// Root protection
router.use(requireAuth);
router.use(requireRole(['SUPERADMIN']));

// Dynamic Generic Endpoints
router.get('/tablas', getTablas);
router.get('/tablas/:tabla', getRegistros);
router.post('/tablas/:tabla', createRegistro);
router.put('/tablas/:tabla/:id', updateRegistro);
router.delete('/tablas/:tabla/:id', deleteRegistro);

module.exports = router;
