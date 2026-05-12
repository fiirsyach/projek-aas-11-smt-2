const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Pastikan login dan getMe adalah FUNCTIONS, bukan undefined
router.post('/login', login);
router.get('/me', verifyToken, getMe);

module.exports = router;