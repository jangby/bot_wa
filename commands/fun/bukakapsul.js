const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bukakapsul',
    description: 'Buka kapsul waktu yang sudah matang',
    async execute(client, msg, args, { chat }) {
        const dbPath = path.join(__dirname, '../../data/kapsul.json');
        let db = JSON.parse(fs.readFileSync(dbPath));
        const chatId = chat.id._serialized;
        const now = Date.now();

        // Cari kapsul di grup ini yang waktunya sudah lewat (openDate <= now)
        const readyCapsules = db.filter(k => k.chatId === chatId && k.openDate <= now);
        
        if (readyCapsules.length === 0) {
            // Cek apakah ada yang belum kebuka
            const pending = db.filter(k => k.chatId === chatId).length;
            if (pending > 0) return msg.reply(`🔒 Belum ada kapsul yang bisa dibuka. Masih ada ${pending} kapsul terkunci.`);
            return msg.reply('📭 Tidak ada kapsul waktu di grup ini.');
        }

        let text = `🔓 *KAPSUL WAKTU TERBUKA!* 🔓\n\n`;
        readyCapsules.forEach((k, i) => {
            text += `📩 *Pesan ${i+1}* (Dari: ${k.from})\n"${k.message}"\n\n`;
        });

        // Hapus kapsul yang sudah dibuka dari database
        db = db.filter(k => !(k.chatId === chatId && k.openDate <= now));
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(text);
    }
};