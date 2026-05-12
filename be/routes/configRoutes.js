const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', getConfig);
router.put('/', verifyToken, checkRole('super_admin'), updateConfig);

module.exports = router;