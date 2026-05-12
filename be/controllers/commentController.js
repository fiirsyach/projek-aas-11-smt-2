const db = require('../config/database');

// Create comment (with reply support)
const createComment = async (req, res) => {
    try {
        const { laporan_id, comment, parent_id, is_balasan_tanggapan } = req.body;
        const user_id = req.user.id;
        
        if (!laporan_id || !comment) {
            return res.status(400).json({ message: 'Laporan ID dan komentar harus diisi' });
        }
        
        const [laporan] = await db.query('SELECT * FROM laporan WHERE id = ?', [laporan_id]);
        if (laporan.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        const [result] = await db.query(
            'INSERT INTO comments (laporan_id, user_id, comment, parent_id, is_balasan_tanggapan) VALUES (?, ?, ?, ?, ?)',
            [laporan_id, user_id, comment, parent_id || null, is_balasan_tanggapan || false]
        );
        
        const [user] = await db.query('SELECT name, role FROM users WHERE id = ?', [user_id]);
        
        res.status(201).json({
            id: result.insertId,
            laporan_id,
            user_id,
            user_name: user[0].name,
            user_role: user[0].role,
            comment,
            parent_id: parent_id || null,
            is_balasan_tanggapan: is_balasan_tanggapan || false,
            created_at: new Date(),
            replies: []
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get comments by laporan ID (with replies)
const getCommentsByLaporan = async (req, res) => {
    try {
        const { laporanId } = req.params;
        
        const [comments] = await db.query(`
            SELECT c.*, u.name as user_name, u.role as user_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.laporan_id = ?
            ORDER BY c.created_at ASC
        `, [laporanId]);
        
        // Susun komentar menjadi tree
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
        
        res.json(rootComments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete comment (owner or admin/super admin)
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Cek kepemilikan komentar
        const [comment] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
        
        if (comment.length === 0) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }
        
        // Hanya pemilik komentar atau admin/super admin yang bisa hapus
        if (comment[0].user_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ message: 'Tidak memiliki izin untuk menghapus komentar ini' });
        }
        
        // Hapus semua reply terlebih dahulu
        await db.query('DELETE FROM comments WHERE parent_id = ?', [id]);
        // Hapus comment
        const [result] = await db.query('DELETE FROM comments WHERE id = ?', [id]);
        
        res.json({ message: 'Komentar berhasil dihapus' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update comment (only owner)
const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;
        
        const [cekComment] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
        
        if (cekComment.length === 0) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }
        
        if (cekComment[0].user_id !== userId) {
            return res.status(403).json({ message: 'Tidak memiliki izin untuk mengedit komentar ini' });
        }
        
        await db.query('UPDATE comments SET comment = ? WHERE id = ?', [comment, id]);
        res.json({ message: 'Komentar berhasil diupdate' });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createComment, 
    getCommentsByLaporan, 
    deleteComment, 
    updateComment 
};