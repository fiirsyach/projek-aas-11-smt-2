const express = require('express');
const router = express.Router();
const { cetakPDF, cetakExcel } = require('../controllers/cetakController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/pdf', verifyToken, checkRole('admin', 'super_admin'), cetakPDF);
router.get('/excel', verifyToken, checkRole('admin', 'super_admin'), cetakExcel);

module.exports = router;