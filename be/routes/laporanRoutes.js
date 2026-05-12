const express = require('express');
const router = express.Router();
const {
    getAllLaporan,
    getLaporanById,
    createLaporan,
    updateLaporan,
    updateLaporanStatus,
    addTanggapan,
    deleteLaporan,
    getLaporanStats
} = require('../controllers/laporanController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes yang memerlukan authentication
router.get('/', verifyToken, getAllLaporan);
router.get('/stats', verifyToken, getLaporanStats);
router.get('/:id', verifyToken, getLaporanById);
router.post('/', verifyToken, upload.single('image'), createLaporan);

// User only - edit laporan sendiri (hanya yang status pending)
router.put('/:id', verifyToken, updateLaporan);
// User only - hapus laporan sendiri (hanya yang status pending)
router.delete('/:id', verifyToken, deleteLaporan);

// Admin & Super Admin only
router.put('/:id/status', verifyToken, checkRole('admin', 'super_admin'), updateLaporanStatus);
router.post('/:id/tanggapan', verifyToken, checkRole('admin', 'super_admin'), addTanggapan);

module.exports = router;