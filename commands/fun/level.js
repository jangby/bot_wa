const levelSystem = require('../../utils/level');

module.exports = {
    name: 'level',
    description: 'Cek level dan pangkatmu saat ini',
    type: 'fun',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        
        // Mengambil data user dari sistem memori yang baru
        const user = levelSystem.getUser(userId);
        const role = levelSystem.getRole(user.level);

        // Menghitung sisa pesan untuk naik ke level berikutnya
        // Rumus: (Level saat ini + 1) * 5 pesan - jumlah pesan sekarang
        const nextLevelPesan = (user.level + 1) * 5;
        const sisaPesan = nextLevelPesan - user.xp;

        const text = `📊 *STATUS LEVEL KAMU* 📊

👤 *Nama:* ${contact.pushname || 'User'}
⭐ *Level:* ${user.level}
🎖️ *Pangkat:* ${role}
💬 *Total Pesan:* ${user.xp}

📈 *Progress:*
Butuh *${sisaPesan}* pesan lagi untuk naik ke level *${user.level + 1}*.

_Teruslah berbincang dengan bijak di grup!_`;

        msg.reply(text);
    }
};