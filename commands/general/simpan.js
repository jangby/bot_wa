const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'simpan',
    description: 'Simpan catatan grup',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (args.length < 2) return msg.reply('❌ Format: *!simpan [judul] [isi]*');

        const judul = args[0].toLowerCase();
        const isi = args.slice(1).join(' ');
        const chatId = chat.id._serialized;
        
        // Path ke file database JSON
        const dbPath = path.join(__dirname, '../../data/catatan.json');
        
        // Baca database
        let db = JSON.parse(fs.readFileSync(dbPath));

        // Buat objek grup jika belum ada
        if (!db[chatId]) db[chatId] = {};

        // Simpan catatan
        db[chatId][judul] = isi;

        // Tulis ulang ke file
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`✅ Catatan *${judul}* berhasil disimpan!`);
    }
};