const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, checkRole('super_admin'), getAllUsers);
router.get('/:id', verifyToken, checkRole('super_admin'), getUserById);
router.post('/', verifyToken, checkRole('super_admin'), createUser);
router.put('/:id', verifyToken, checkRole('super_admin'), updateUser);
router.delete('/:id', verifyToken, checkRole('super_admin'), deleteUser);

module.exports = router;