const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'carisurat',
    description: 'Mencari data surat berdasarkan kata kunci perihal/judul',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        if (args.length === 0) {
            return msg.reply('⚠️ Harap masukkan kata kunci pencarian!\nContoh: *!carisurat rapat wali santri*');
        }

        const keyword = args.join(' ').toLowerCase();
        
        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        let hasilPencarian = [];

        // Cari di Yayasan
        db.yayasan.list.forEach(s => {
            if (s.nama_surat.toLowerCase().includes(keyword) || s.nomor_surat.toLowerCase().includes(keyword)) {
                hasilPencarian.push({ ...s, kategori: 'Yayasan' });
            }
        });

        // Cari di Pesantren
        db.pesantren.list.forEach(s => {
            if (s.nama_surat.toLowerCase().includes(keyword) || s.nomor_surat.toLowerCase().includes(keyword)) {
                hasilPencarian.push({ ...s, kategori: 'Pesantren' });
            }
        });

        if (hasilPencarian.length === 0) {
            return msg.reply(`❌ Tidak ditemukan surat yang mengandung kata kunci: *${keyword}*`);
        }

        let txt = `🔍 *HASIL PENCARIAN SURAT* 🔍\nKata Kunci: _"${keyword}"_\nDitemukan: ${hasilPencarian.length} surat\n\n`;

        hasilPencarian.forEach((s, index) => {
            txt += `${index + 1}. *ID:* ${s.id}\n`;
            txt += `   📄 *Nomor:* ${s.nomor_surat}\n`;
            txt += `   📝 *Perihal:* ${s.nama_surat}\n`;
            txt += `   🏛️ *Instansi:* ${s.kategori}\n`;
            txt += `   🗄️ *Arsip:* ${s.file_arsip ? '✅ Tersedia (Ketik !getsurat ' + s.id + ')' : '❌ Belum Upload'}\n\n`;
        });

        msg.reply(txt.trim());
    }
};