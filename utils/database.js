const mysql = require('mysql2');

// Membuat Connection Pool untuk performa tinggi & stabil
const pool = mysql.createPool({
    host: 'localhost',
    user: 'admin_bot',           // Username yang tadi kita buat
    password: 'BotAman123!',     // Password MariaDB kamu
    database: 'bot_db',          // Nama database kamu
    waitForConnections: true,
    connectionLimit: 10,         // Maksimal 10 koneksi bersamaan (cukup untuk bot)
    queueLimit: 0
});

// Menggunakan versi promise agar bisa pakai await/async
const db = pool.promise();

// Mengetes koneksi saat bot baru menyala
db.getConnection()
    .then(connection => {
        console.log('✅ Berhasil terhubung ke database MariaDB!');
        connection.release(); // Lepaskan kembali koneksi ke pool
    })
    .catch(err => {
        console.error('❌ Gagal terhubung ke database:', err.message);
    });

module.exports = db;