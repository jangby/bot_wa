const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addloker',
    description: 'Tambah info loker',
    async execute(client, msg, args, { contact }) {
        const info = args.join(' ');
        if (!info) return msg.reply('❌ Masukkan infonya! Contoh: *!addloker Dicari Admin, hubungi 08xxx*');

        const dbPath = path.join(__dirname, '../../data/loker.json');
        const lokerList = JSON.parse(fs.readFileSync(dbPath));

        // Tambah data baru
        lokerList.push({
            info: info,
            sender: contact.pushname || contact.number,
            date: new Date().toLocaleDateString('id-ID')
        });

        fs.writeFileSync(dbPath, JSON.stringify(lokerList, null, 2));
        msg.reply('✅ Info loker berhasil ditambahkan!');
    }
};