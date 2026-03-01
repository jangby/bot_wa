const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'hadir',
    description: 'Absen kehadiran',
    async execute(client, msg, args, { chat, contact }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');

        const dbPath = path.join(__dirname, '../../data/absensi.json');
        const db = JSON.parse(fs.readFileSync(dbPath));
        const chatId = chat.id._serialized;

        // Cek apakah ada sesi absen
        if (!db[chatId] || !db[chatId].status) {
            return msg.reply('❌ Tidak ada absensi yang sedang dibuka admin.');
        }

        const nama = contact.pushname || contact.number;
        const userId = contact.id._serialized;

        // Cek duplikasi
        if (db[chatId].peserta.some(p => p.id === userId)) {
            return msg.reply('⚠️ Kamu sudah absen sebelumnya!');
        }

        // Tambahkan peserta
        db[chatId].peserta.push({ name: nama, id: userId });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`✅ *${nama}* berhasil absen!\n(Total: ${db[chatId].peserta.length} orang)`);
    }
};