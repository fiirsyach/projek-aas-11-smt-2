const db = require('../config/database');

// Get all laporan with category name
const getAllLaporan = async (req, res) => {
    try {
        const { status, category_id, search, user_id } = req.query;
        let query = `
            SELECT l.*, 
                   u.name as user_name, 
                   c.name as category_name,
                   c.id as category_id
            FROM laporan l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE 1=1
        `;
        const params = [];
        
        if (user_id) {
            query += ' AND l.user_id = ?';
            params.push(user_id);
        }
        
        if (status) {
            query += ' AND l.status = ?';
            params.push(status);
        }
        
        if (category_id) {
            query += ' AND l.category_id = ?';
            params.push(category_id);
        }
        
        if (search) {
            query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY l.created_at DESC';
        
        const [laporan] = await db.query(query, params);
        res.json(laporan);
    } catch (error) {
        console.error('Get all laporan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get laporan by ID with category and comments
const getLaporanById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [laporan] = await db.query(`
            SELECT l.*, 
                   u.name as user_name, 
                   u.email as user_email,
                   c.name as category_name,
                   c.id as category_id
            FROM laporan l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE l.id = ?
        `, [id]);
        
        if (laporan.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        // Get comments with user info
        const [comments] = await db.query(`
            SELECT c.*, u.name as user_name, u.role as user_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.laporan_id = ?
            ORDER BY c.created_at ASC
        `, [id]);
        
        // Susun komentar menjadi tree (parent - replies)
        const commentMap = {};
        const rootComments = [];
        
        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment.id] = comment;
            
            if (comment.parent_id === null) {
                rootComments.push(comment);
            } else {
                if (commentMap[comment.parent_id]) {
                    commentMap[comment.parent_id].replies.push(comment);
                }
            }
        });
        
        res.json({ ...laporan[0], comments: rootComments });
    } catch (error) {
        console.error('Get laporan by id error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create laporan with category
const createLaporan = async (req, res) => {
    try {
        const { title, lokasi, description, category_id } = req.body;
        const user_id = req.user.id;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        if (!title || !description) {
            return res.status(400).json({ message: 'Judul dan deskripsi harus diisi' });
        }
        
        const [result] = await db.query(
            'INSERT INTO laporan (user_id, category_id, title, lokasi, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, category_id || null, title, lokasi || null, description, image_url, 'pending']
        );
        
        // Ambil data laporan yang baru dibuat
        const [newLaporan] = await db.query(`
            SELECT l.*, u.name as user_name, c.name as category_name
            FROM laporan l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE l.id = ?
        `, [result.insertId]);
        
        res.status(201).json({ 
            success: true,
            message: 'Laporan berhasil dibuat',
            id: result.insertId,
            laporan: newLaporan[0]
        });
    } catch (error) {
        console.error('Create laporan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update laporan (User only for their own pending reports)
const updateLaporan = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, lokasi, description, category_id } = req.body;
        const user_id = req.user.id;
        
        // Cek apakah laporan milik user dan statusnya pending
        const [laporan] = await db.query(
            'SELECT * FROM laporan WHERE id = ? AND user_id = ? AND status = "pending"',
            [id, user_id]
        );
        
        if (laporan.length === 0) {
            return res.status(403).json({ 
                message: 'Tidak dapat mengedit laporan ini. Hanya laporan dengan status pending yang bisa diedit.' 
            });
        }
        
        await db.query(
            'UPDATE laporan SET title = ?, lokasi = ?, description = ?, category_id = ? WHERE id = ?',
            [title, lokasi, description, category_id, id]
        );
        
        res.json({ success: true, message: 'Laporan berhasil diupdate' });
    } catch (error) {
        console.error('Update laporan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update laporan status (Admin & Super Admin)
const updateLaporanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validasi status yang diperbolehkan
        const validStatus = ['pending', 'diproses', 'selesai', 'ditolak', 'approved', 'rejected'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid' });
        }
        
        const [result] = await db.query(
            'UPDATE laporan SET status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        res.json({ 
            success: true,
            message: `Status laporan berhasil diubah menjadi ${status}` 
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add tanggapan (Admin & Super Admin)
const addTanggapan = async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggapan } = req.body;
        
        if (!tanggapan || tanggapan.trim() === '') {
            return res.status(400).json({ message: 'Tanggapan tidak boleh kosong' });
        }
        
        const [result] = await db.query(
            'UPDATE laporan SET tanggapan = ? WHERE id = ?',
            [tanggapan, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        res.json({ 
            success: true,
            message: 'Tanggapan berhasil ditambahkan' 
        });
    } catch (error) {
        console.error('Add tanggapan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete laporan (User untuk laporan sendiri, Super Admin untuk semua)
const deleteLaporan = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const user_role = req.user.role;
        
        // Cek kepemilikan laporan
        const [laporan] = await db.query(
            'SELECT * FROM laporan WHERE id = ?',
            [id]
        );
        
        if (laporan.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        // User hanya bisa hapus laporan milik sendiri dengan status pending
        if (user_role !== 'super_admin') {
            if (laporan[0].user_id !== user_id || laporan[0].status !== 'pending') {
                return res.status(403).json({ 
                    message: 'Tidak dapat menghapus laporan ini. Hanya laporan dengan status pending milik sendiri yang bisa dihapus.' 
                });
            }
        }
        
        // Hapus comments terlebih dahulu
        await db.query('DELETE FROM comments WHERE laporan_id = ?', [id]);
        // Hapus laporan
        await db.query('DELETE FROM laporan WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Laporan berhasil dihapus' });
    } catch (error) {
        console.error('Delete laporan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get laporan stats for dashboard
const getLaporanStats = async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM laporan');
        const [pending] = await db.query('SELECT COUNT(*) as count FROM laporan WHERE status = "pending"');
        const [diproses] = await db.query('SELECT COUNT(*) as count FROM laporan WHERE status = "diproses"');
        const [selesai] = await db.query('SELECT COUNT(*) as count FROM laporan WHERE status IN ("selesai", "approved")');
        const [ditolak] = await db.query('SELECT COUNT(*) as count FROM laporan WHERE status IN ("ditolak", "rejected")');
        
        res.json({
            total: total[0].count,
            pending: pending[0].count,
            diproses: diproses[0].count,
            selesai: selesai[0].count,
            ditolak: ditolak[0].count
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllLaporan,
    getLaporanById,
    createLaporan,
    updateLaporan,
    updateLaporanStatus,
    addTanggapan,
    deleteLaporan,
    getLaporanStats
};