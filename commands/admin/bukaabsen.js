const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bukaabsen',
    description: 'Buka sesi absensi baru',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya Admin!');

        const kegiatan = args.join(' ') || 'Kegiatan Rutin';
        const dbPath = path.join(__dirname, '../../data/absensi.json');
        
        // Reset data absen lama
        let db = JSON.parse(fs.readFileSync(dbPath));
        db[chat.id._serialized] = {
            status: true,
            kegiatan: kegiatan,
            peserta: []
        };

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        
        msg.reply(`📋 *ABSENSI DIBUKA*\n\nKegiatan: *${kegiatan}*\nSilakan ketik *!hadir* untuk mengisi daftar.`);
    }
};