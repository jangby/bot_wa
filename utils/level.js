const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/level.json');

// Helper Load/Save
const loadDb = () => {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
    return JSON.parse(fs.readFileSync(dbPath));
};
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = {
    // Fungsi Utama: Tambah XP
    addXp: (userId) => {
        let db = loadDb();
        
        // Setup User Baru
        if (!db[userId]) {
            db[userId] = {
                xp: 0,
                level: 0,
                lastMsg: 0
            };
        }

        const user = db[userId];
        const now = Date.now();

        // COOLDOWN: Cek apakah sudah 1 menit (60000 ms) dari pesan terakhir?
        // Agar tidak farming XP dengan spam
        if (now - user.lastMsg < 60000) {
            return { leveledUp: false, emoji: module.exports.getEmoji(user.level) }; 
        }

        // Tambah XP Random (1 - 10)
        const xpGain = Math.floor(Math.random() * 10) + 1;
        user.xp += xpGain;
        user.lastMsg = now;

        // Hitung Level Baru (Setiap 100 XP = 1 Level)
        // Rumus: Level = Math.floor(XP / 100)
        const currentLevel = user.level;
        const newLevel = Math.floor(user.xp / 100);

        let leveledUp = false;
        
        // Cek Naik Level
        if (newLevel > currentLevel) {
            user.level = newLevel;
            leveledUp = true;
        }

        saveDb(db);

        // Kembalikan info untuk dipakai di index.js
        return {
            leveledUp: leveledUp,
            level: newLevel,
            xp: user.xp,
            emoji: module.exports.getEmoji(newLevel)
        };
    },

    // Fungsi Ambil Emoji Berdasarkan Level
    getEmoji: (level) => {
        if (level < 5) return '🗿';   // Level 0-4 (Newbie)
        if (level < 20) return '🔥';  // Level 5-19 (Active)
        if (level < 50) return '💎';  // Level 20-49 (Pro)
        if (level < 100) return '👑'; // Level 50-99 (Sultan)
        return '⚡';                  // Level 100+ (God)
    },

    // Fungsi Ambil Pangkat (Role Name)
    getRole: (level) => {
        if (level < 5) return 'Warga Biasa';
        if (level < 20) return 'Jagoan Lokal';
        if (level < 50) return 'Sepuh Grup';
        if (level < 100) return 'Sultan';
        return 'Dewa Admin';
    },

    // Fungsi Ambil Data User
    getUser: (userId) => {
        let db = loadDb();
        if (!db[userId]) return { xp: 0, level: 0 };
        return db[userId];
    },

    // Fungsi Leaderboard (Top 5)
    getLeaderboard: () => {
        let db = loadDb();
        // Ubah object ke array, lalu sort berdasarkan XP tertinggi
        return Object.entries(db)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10); // Ambil Top 10
    }
};