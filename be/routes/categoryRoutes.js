const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public (butuh login untuk akses)
router.get('/', verifyToken, getAllCategories);
router.get('/:id', verifyToken, getCategoryById);

// Admin & Super Admin only
router.post('/', verifyToken, checkRole('admin', 'super_admin'), createCategory);
router.put('/:id', verifyToken, checkRole('admin', 'super_admin'), updateCategory);

// Super Admin only
router.delete('/:id', verifyToken, checkRole('super_admin'), deleteCategory);

module.exports = router;