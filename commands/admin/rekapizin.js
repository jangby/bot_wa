const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const NOMOR_PEMBERI_IZIN = '6285188427706@c.us';

module.exports = {
    name: 'rekapizin',
    description: 'Download file rekap izin lab',
    async execute(client, msg, args, { isOwner }) {
        // File hanya boleh diakses oleh Owner bot DAN nomor Pemberi Izin
        if (!isOwner && msg.from !== NOMOR_PEMBERI_IZIN) {
            return msg.reply('❌ Anda tidak memiliki hak akses untuk file ini!');
        }

        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) {
            return msg.reply('📂 Belum ada data pengajuan izin lab saat ini.');
        }

        // Membentuk file JSON menjadi Document Media dan mengirimkannya
        const fileRekap = MessageMedia.fromFilePath(dbPath);
        await client.sendMessage(msg.from, fileRekap, { caption: '📄 *Berikut adalah file Rekap Data Izin Lab Komputer (JSON).*' });
    }
};