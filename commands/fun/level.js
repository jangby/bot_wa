const levelSystem = require('../../utils/level');

module.exports = {
    name: 'level',
    description: 'Cek level, XP, dan pangkat kamu',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        const data = levelSystem.getUser(userId);
        
        const role = levelSystem.getRole(data.level);
        const emoji = levelSystem.getEmoji(data.level);

        // Hitung sisa XP ke level selanjutnya
        // Rumus: Next Level * 100
        const nextLevelXp = (data.level + 1) * 100;
        const kurangXp = nextLevelXp - data.xp;

        // Bikin Progress Bar sederhana
        const persentase = Math.floor((data.xp % 100) / 10); // 0-10
        const bar = '▓'.repeat(persentase) + '░'.repeat(10 - persentase);

        const text = `📊 *PROFIL LEVEL* 📊

👤 Nama: ${contact.pushname || contact.number}
🏅 Pangkat: *${role}* ${emoji}
🆙 Level: *${data.level}*
✨ Total XP: *${data.xp}*

Progress ke Level ${data.level + 1}:
[${bar}]
_Kurang ${kurangXp} XP lagi untuk naik level!_`;

        await msg.reply(text);
    }
};