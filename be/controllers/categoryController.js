const db = require('../config/database');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (categories.length === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        }
        res.json(categories[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create category (Admin & Super Admin)
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: 'Nama kategori harus diisi' });
        }
        
        // Cek duplikat
        const [existing] = await db.query('SELECT * FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kategori sudah ada' });
        }
        
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            name,
            description,
            message: 'Kategori berhasil ditambahkan'
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        }
        
        res.json({ message: 'Kategori berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete category (Super Admin only)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cek apakah kategori sedang digunakan
        const [used] = await db.query('SELECT * FROM laporan WHERE category_id = ?', [id]);
        if (used.length > 0) {
            return res.status(400).json({ message: 'Kategori sedang digunakan pada laporan, tidak dapat dihapus' });
        }
        
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        }
        
        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};