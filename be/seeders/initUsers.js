const db = require('../config/database');
const bcrypt = require('bcryptjs');

const initUsers = async () => {
    const users = [
        { name: 'Budi Santoso', email: 'budi@gmail.com', password: 'password123', role: 'user' },
        { name: 'Siti Aminah', email: 'siti@gmail.com', password: 'password123', role: 'user' },
        { name: 'Dedi Kurniawan', email: 'dedi@gmail.com', password: 'password123', role: 'user' },
        { name: 'Admin Utama', email: 'admin@gmail.com', password: 'password123', role: 'admin' },
        { name: 'Super Admin', email: 'superadmin@gmail.com', password: 'password123', role: 'super_admin' }
    ];
    
    for (const user of users) {
        // Cek apakah user sudah ada
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [user.email]);
        
        if (existing.length === 0) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [user.name, user.email, hashedPassword, user.role]
            );
            console.log(`✅ User created: ${user.email} (${user.role})`);
        } else {
            console.log(`⏭️ User already exists: ${user.email}`);
        }
    }
    
    console.log('🎉 Users initialization complete!');
};

module.exports = initUsers;