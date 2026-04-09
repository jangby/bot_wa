const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'hapussurat',
    description: 'Menghapus data nomor surat jika ada kesalahan',
    async execute(client, msg, args) {
        if (!msg.from.endsWith('@g.us')) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        if (args.length === 0) return msg.reply('⚠️ Harap masukkan ID Surat yang ingin dihapus.\nContoh: *!hapussurat YAY001*');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        const targetId = args[0].toUpperCase();
        let found = false;
        let deletedSurat = null;

        // Cari ID di array Yayasan
        const yayIndex = db.yayasan.list.findIndex(s => s.id === targetId);
        if (yayIndex !== -1) {
            deletedSurat = db.yayasan.list.splice(yayIndex, 1)[0];
            found = true;
        }

        // Jika tidak ada di Yayasan, cari di array Pesantren
        if (!found) {
            const pstIndex = db.pesantren.list.findIndex(s => s.id === targetId);
            if (pstIndex !== -1) {
                deletedSurat = db.pesantren.list.splice(pstIndex, 1)[0];
                found = true;
            }
        }

        if (!found) {
            return msg.reply(`❌ Data Surat dengan ID *${targetId}* tidak ditemukan!`);
        }

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        msg.reply(`✅ *Surat Berhasil Dihapus dari Rekap*\n\nNomor: ${deletedSurat.nomor_surat}\nPerihal: ${deletedSurat.nama_surat}`);
    }
};