const db = require('../config/database');

const getAuditLogs = async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT al.*, u.name as user_name 
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json(logs || []);
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.json([]); // Return empty array instead of error
    }
};

const createAuditLog = async (userId, action, target) => {
    try {
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target) VALUES (?, ?, ?)',
            [userId, action, target]
        );
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

module.exports = { getAuditLogs, createAuditLog };