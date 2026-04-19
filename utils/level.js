const db = require('./database');

// Memori RAM Sementara untuk Leveling
let dbLevel = {};

// 1. LOAD DATA DARI DATABASE SAAT BOT NYALA
const loadData = async () => {
    try {
        // Kita ambil user_id, xp (sebagai penghitung pesan), level, dan last_msg
        const [users] = await db.query('SELECT user_id, xp, level, last_msg FROM users');
        users.forEach(u => {
            dbLevel[u.user_id] = {
                messageCount: Number(u.xp), // Kita gunakan kolom XP untuk hitung jumlah pesan
                level: Number(u.level),
                lastMsg: Number(u.last_msg)
            };
        });
        console.log('✅ Data Leveling (Sistem 5 Pesan) sukses dimuat!');
    } catch (err) {
        console.error('❌ Gagal load data Leveling:', err.message);
    }
};
loadData();

// 2. AUTO-SAVE KE DATABASE TIAP 30 DETIK
setInterval(async () => {
    try {
        for (const [userId, data] of Object.entries(dbLevel)) {
            await db.query(
                'INSERT INTO users (user_id, xp, level, last_msg) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE xp = ?, level = ?, last_msg = ?',
                [userId, data.messageCount, data.level, data.lastMsg, data.messageCount, data.level, data.lastMsg]
            );
        }
    } catch (err) {
        // Silent error
    }
}, 30000);

module.exports = {
    // Fungsi Utama: Tambah XP berdasarkan jumlah pesan
    addXp: (userId) => {
        if (!dbLevel[userId]) {
            dbLevel[userId] = { messageCount: 0, level: 0, lastMsg: 0 };
        }

        const user = dbLevel[userId];
        const now = Date.now();

        // COOLDOWN: 15 detik antar pesan agar tidak spamming pesan pendek untuk kejar level
        if (now - user.lastMsg < 15000) {
            return { leveledUp: false, announce: false }; 
        }

        user.messageCount += 1;
        user.lastMsg = now;

        // LOGIKA: 5 Pesan = 1 Level
        const newLevel = Math.floor(user.messageCount / 5);
        const oldLevel = user.level;

        let leveledUp = false;
        let announce = false;
        
        if (newLevel > oldLevel) {
            user.level = newLevel;
            leveledUp = true;
            
            // PEMBERITAHUAN: Hanya jika level baru adalah kelipatan 5
            if (newLevel % 5 === 0) {
                announce = true;
            }
        }

        return {
            leveledUp: leveledUp,
            announce: announce, // Flag untuk index.js apakah harus kirim chat atau tidak
            level: newLevel,
            role: module.exports.getRole(newLevel)
        };
    },

    // Fungsi Ambil Pangkat (Tanpa Emoji sesuai permintaan)
    getRole: (level) => {
        if (level < 5) return 'Warga Sipil';
        if (level < 20) return 'Anggota Aktif';
        if (level < 50) return 'Sepuh Grup';
        if (level < 100) return 'Sultan';
        return 'Legenda Hidup';
    },

    getUser: (userId) => {
        if (!dbLevel[userId]) return { xp: 0, level: 0 };
        return {
            xp: dbLevel[userId].messageCount,
            level: dbLevel[userId].level
        };
    },

    getLeaderboard: () => {
        return Object.entries(dbLevel)
            .map(([id, data]) => ({ id, xp: data.messageCount, level: data.level }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);
    }
};