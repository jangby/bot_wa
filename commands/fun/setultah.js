const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setultah',
    description: 'Set tanggal ulang tahun',
    async execute(client, msg, args, { contact }) {
        if (args.length === 0) return msg.reply('❌ Format: *!setultah DD-MM-YYYY*\nContoh: *!setultah 17-08-2000*');

        const tgl = args[0];
        // Validasi format tanggal sederhana
        if (!tgl.match(/^\d{2}-\d{2}-\d{4}$/)) return msg.reply('❌ Format salah! Harus DD-MM-YYYY (Contoh: 12-05-1998)');

        const dbPath = path.join(__dirname, '../../data/ultah.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        db[contact.id._serialized] = tgl;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply('🎂 Tanggal ulang tahun berhasil disimpan!');
    }
};