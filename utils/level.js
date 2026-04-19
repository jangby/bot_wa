const db = require('./database');

// Memori RAM Sementara untuk Level & XP
let dbLevel = {};

// 1. LOAD DATA DARI DATABASE SAAT BOT NYALA
const loadData = async () => {
    try {
        const [users] = await db.query('SELECT user_id, xp, level, last_msg FROM users');
        users.forEach(u => {
            dbLevel[u.user_id] = {
                xp: Number(u.xp),
                level: Number(u.level),
                lastMsg: Number(u.last_msg)
            };
        });
        console.log('✅ Data Level & XP sukses dimuat dari MariaDB!');
    } catch (err) {
        console.error('❌ Gagal load data Level:', err.message);
    }
};
loadData();

// 2. AUTO-SAVE KE DATABASE TIAP 30 DETIK DI LATAR BELAKANG
setInterval(async () => {
    try {
        for (const [userId, data] of Object.entries(dbLevel)) {
            // Update data XP dan Level, jika user belum ada maka akan dibuatkan otomatis
            await db.query(
                'INSERT INTO users (user_id, xp, level, last_msg) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE xp = ?, level = ?, last_msg = ?',
                [userId, data.xp, data.level, data.lastMsg, data.xp, data.level, data.lastMsg]
            );
        }
    } catch (err) {
        // Error disembunyikan agar log tidak spam
    }
}, 30000);

module.exports = {
    // Fungsi Utama: Tambah XP
    addXp: (userId) => {
        // Setup User Baru di RAM jika belum ada
        if (!dbLevel[userId]) {
            dbLevel[userId] = { xp: 0, level: 0, lastMsg: 0 };
        }

        const user = dbLevel[userId];
        const now = Date.now();

        // COOLDOWN: Cek apakah sudah 1 menit dari pesan terakhir?
        if (now - user.lastMsg < 60000) {
            return { leveledUp: false, emoji: module.exports.getEmoji(user.level) }; 
        }

        // Tambah XP Random (1 - 10)
        const xpGain = Math.floor(Math.random() * 10) + 1;
        user.xp += xpGain;
        user.lastMsg = now;

        // Hitung Level Baru
        const currentLevel = user.level;
        const newLevel = Math.floor(user.xp / 100);

        let leveledUp = false;
        
        // Cek Naik Level
        if (newLevel > currentLevel) {
            user.level = newLevel;
            leveledUp = true;
        }

        return {
            leveledUp: leveledUp,
            level: newLevel,
            xp: user.xp,
            emoji: module.exports.getEmoji(newLevel)
        };
    },

    // Fungsi Ambil Emoji Berdasarkan Level
    getEmoji: (level) => {
        if (level < 5) return '🥉';   
        if (level < 20) return '🥈';  
        if (level < 50) return '🥇';  
        if (level < 100) return '💎'; 
        return '👑';                  
    },

    // Fungsi Ambil Pangkat (Role Name)
    getRole: (level) => {
        if (level < 5) return 'Warga Biasa';
        if (level < 20) return 'Jagoan Lokal';
        if (level < 50) return 'Sepuh Grup';
        if (level < 100) return 'Sultan';
        return 'Dewa Admin';
    },

    // Fungsi Ambil Data User (Instan dari RAM)
    getUser: (userId) => {
        if (!dbLevel[userId]) return { xp: 0, level: 0 };
        return dbLevel[userId];
    },

    // Fungsi Leaderboard (Top 10 Instan)
    getLeaderboard: () => {
        return Object.entries(dbLevel)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);
    }
};