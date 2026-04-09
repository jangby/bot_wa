const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'daftarsurat',
    description: 'Melihat rekap nomor surat',
    async execute(client, msg, args) {
        if (!msg.from.endsWith('@g.us')) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data nomor surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        let filter = args.length > 0 ? args[0].toLowerCase() : 'semua';
        
        if (filter !== 'yayasan' && filter !== 'pesantren' && filter !== 'semua') {
            return msg.reply('⚠️ Argumen tidak valid. Gunakan:\n*!daftarsurat*\n*!daftarsurat yayasan*\n*!daftarsurat pesantren*');
        }

        let txt = "🗂️ *REKAP NOMOR SURAT* 🗂️\n\n";
        let isEmpty = true;

        const formatList = (kategori, list) => {
            if (list.length === 0) return '';
            isEmpty = false;
            let res = `*--- ${kategori.toUpperCase()} ---*\n`;
            list.forEach(s => {
                res += `🔹 *ID:* ${s.id}\n`;
                res += `📄 *No:* ${s.nomor_surat}\n`;
                res += `📝 *Perihal:* ${s.nama_surat}\n\n`;
            });
            return res;
        };

        if (filter === 'semua' || filter === 'yayasan') {
            txt += formatList('yayasan', db.yayasan.list);
        }
        if (filter === 'semua' || filter === 'pesantren') {
            txt += formatList('pesantren', db.pesantren.list);
        }

        if (isEmpty) {
            return msg.reply(`📂 Belum ada data surat yang tersimpan untuk kategori *${filter}*.`);
        }

        msg.reply(txt.trim());
    }
};