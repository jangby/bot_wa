const levelSystem = require('../../utils/level');

module.exports = {
    name: 'topglobal',
    description: 'Lihat 10 orang dengan level tertinggi',
    async execute(client, msg, args) {
        const leaderboard = levelSystem.getLeaderboard();

        let text = `🏆 *TOP GLOBAL LEADERBOARD* 🏆\n\n`;

        if (leaderboard.length === 0) {
            return msg.reply('Belum ada data level yang terekam.');
        }

        for (let i = 0; i < leaderboard.length; i++) {
            const user = leaderboard[i];
            const role = levelSystem.getRole(user.level);
            
            // Kita coba ambil nama kontak (agak lambat, jadi pakai ID user aja kalau mau cepat)
            // Atau pakai user.id.split('@')[0]
            text += `${i + 1}. @${user.id.split('@')[0]}\n`;
            text += `   ⭐ Lvl ${user.level} | XP: ${user.xp} | ${role}\n`;
        }

        text += `\n_Terus chatting biar jadi nomor 1!_`;

        // Kirim dengan mention agar namanya bisa diklik (opsional)
        await msg.reply(text, undefined, {
            mentions: leaderboard.map(u => u.id)
        });
    }
};