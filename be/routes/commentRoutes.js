const express = require('express');
const router = express.Router();
const {
    createComment,
    getCommentsByLaporan,
    deleteComment,
    updateComment
} = require('../controllers/commentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createComment);
router.get('/laporan/:laporanId', getCommentsByLaporan);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;