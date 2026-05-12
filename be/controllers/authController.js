const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password harus diisi' });
        }
        
        // Cari user di database
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }
        
        const user = users[0];
        
        // Verifikasi password
        let isValid = false;
        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
            isValid = await bcrypt.compare(password, user.password);
        } else {
            isValid = (password === user.password);
        }
        
        if (!isValid) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }
        
        // Generate token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                name: user.name 
            },
            process.env.JWT_SECRET || 'secret_key_2026',
            { expiresIn: '7d' }
        );
        
        // Response
        res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
    }
};

// Fungsi getMe
const getMe = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: error.message });
    }
};

// EXPORT dengan benar
module.exports = { 
    login, 
    getMe 
};