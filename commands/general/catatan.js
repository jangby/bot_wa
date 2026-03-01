const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'catatan',
    description: 'Lihat catatan grup',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        
        const chatId = chat.id._serialized;
        const dbPath = path.join(__dirname, '../../data/catatan.json');
        
        // Cek file ada atau tidak
        if (!fs.existsSync(dbPath)) return msg.reply('📭 Belum ada catatan sama sekali.');

        const db = JSON.parse(fs.readFileSync(dbPath));

        // Cek catatan grup ini
        if (!db[chatId] || Object.keys(db[chatId]).length === 0) {
            return msg.reply('📭 Grup ini belum punya catatan. Gunakan *!simpan* untuk membuatnya.');
        }

        // Jika user cuma ketik !catatan (tampilkan daftar)
        if (args.length === 0) {
            let text = `📚 *DAFTAR CATATAN GRUP* 📚\n\n`;
            for (let judul in db[chatId]) {
                text += `• ${judul}\n`;
            }
            text += `\n_Ketik *!catatan [judul]* untuk membacanya._`;
            return msg.reply(text);
        }

        // Jika user ketik !catatan judul (tampilkan isi)
        const judul = args[0].toLowerCase();
        if (db[chatId][judul]) {
            msg.reply(`📄 *${judul.toUpperCase()}*\n\n${db[chatId][judul]}`);
        } else {
            msg.reply('❌ Catatan tidak ditemukan.');
        }
    }
};