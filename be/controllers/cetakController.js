const db = require('../config/database');

const cetakPDF = async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = `SELECT l.*, u.name as user_name FROM laporan l JOIN users u ON l.user_id = u.id`;
        const params = [];
        
        if (start && end) {
            query += ` WHERE DATE(l.created_at) BETWEEN ? AND ?`;
            params.push(start, end);
        }
        
        query += ` ORDER BY l.created_at DESC`;
        
        const [laporan] = await db.query(query, params);
        
        // Untuk demo, kirim JSON dulu (nanti bisa diintegrasi dengan PDF library)
        res.json({ message: 'PDF generation - coming soon', data: laporan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const cetakExcel = async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = `SELECT l.*, u.name as user_name FROM laporan l JOIN users u ON l.user_id = u.id`;
        const params = [];
        
        if (start && end) {
            query += ` WHERE DATE(l.created_at) BETWEEN ? AND ?`;
            params.push(start, end);
        }
        
        query += ` ORDER BY l.created_at DESC`;
        
        const [laporan] = await db.query(query, params);
        
        res.json({ message: 'Excel generation - coming soon', data: laporan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { cetakPDF, cetakExcel };