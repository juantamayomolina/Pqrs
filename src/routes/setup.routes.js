const express = require('express');
const router = express.Router();
const { getSetupStatus, saveSetup } = require('../controllers/setup.controller');

router.get('/status', getSetupStatus);
router.post('/', saveSetup);

module.exports = router;
