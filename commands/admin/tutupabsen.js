const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'tutupabsen',
    description: 'Tutup sesi absensi',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya Admin!');

        const dbPath = path.join(__dirname, '../../data/absensi.json');
        let db = JSON.parse(fs.readFileSync(dbPath));
        const chatId = chat.id._serialized;

        if (!db[chatId] || !db[chatId].status) return msg.reply('❌ Tidak ada absensi aktif.');

        // Generate laporan
        let text = `📋 *REKAP ABSENSI DITUTUP* 📋\n\nKegiatan: ${db[chatId].kegiatan}\n\n`;
        db[chatId].peserta.forEach((p, i) => {
            text += `${i + 1}. ${p.name}\n`;
        });
        text += `\nTotal Hadir: *${db[chatId].peserta.length} Orang*`;

        // Matikan status
        db[chatId].status = false;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(text);
    }
};