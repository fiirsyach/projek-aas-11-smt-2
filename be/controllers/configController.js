const db = require('../config/database');

const getConfig = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM config WHERE id = 1');
        if (rows.length === 0) {
            return res.json({ instansi_name: 'Pemerintah Kota', logo_url: '', footer_text: '' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Get config error:', error);
        res.json({ instansi_name: 'Pemerintah Kota', logo_url: '', footer_text: '' });
    }
};

const updateConfig = async (req, res) => {
    try {
        const { instansi_name, logo_url, footer_text } = req.body;
        
        const [existing] = await db.query('SELECT * FROM config WHERE id = 1');
        if (existing.length === 0) {
            await db.query(
                'INSERT INTO config (id, instansi_name, logo_url, footer_text) VALUES (1, ?, ?, ?)',
                [instansi_name, logo_url, footer_text]
            );
        } else {
            await db.query(
                'UPDATE config SET instansi_name = ?, logo_url = ?, footer_text = ? WHERE id = 1',
                [instansi_name, logo_url, footer_text]
            );
        }
        
        res.json({ message: 'Config updated successfully' });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getConfig, updateConfig };