const db = require('./database');

module.exports = {
    // Mencatat atau memperbarui waktu terakhir member chat
    recordActivity: async (userId, groupId) => {
        try {
            await db.query(
                'INSERT INTO group_activity (user_id, group_id, last_seen) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()',
                [userId, groupId]
            );
        } catch (err) {
            console.error('[ACTIVITY ERROR]:', err.message);
        }
    },

    // Mengambil daftar member yang tidak aktif lebih dari 7 hari
    getInactiveMembers: async () => {
        try {
            const [rows] = await db.query(
                'SELECT user_id, group_id FROM group_activity WHERE last_seen < DATE_SUB(NOW(), INTERVAL 7 DAY)'
            );
            return rows;
        } catch (err) {
            console.error('[FETCH INACTIVE ERROR]:', err.message);
            return [];
        }
    },

    // Menghapus data aktivitas jika member sudah di-kick atau keluar
    removeRecord: async (userId, groupId) => {
        try {
            await db.query('DELETE FROM group_activity WHERE user_id = ? AND group_id = ?', [userId, groupId]);
        } catch (e) {}
    }
};