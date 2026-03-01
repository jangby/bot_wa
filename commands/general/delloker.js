const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'delloker',
    description: 'Hapus info loker',
    async execute(client, msg, args) {
        const index = parseInt(args[0]) - 1;
        const dbPath = path.join(__dirname, '../../data/loker.json');
        const lokerList = JSON.parse(fs.readFileSync(dbPath));

        if (isNaN(index) || index < 0 || index >= lokerList.length) {
            return msg.reply('❌ Nomor salah! Cek nomor di *!loker*.');
        }

        // Hapus array pada index tersebut
        const deleted = lokerList.splice(index, 1);
        fs.writeFileSync(dbPath, JSON.stringify(lokerList, null, 2));

        msg.reply(`✅ Loker nomor ${index + 1} berhasil dihapus.`);
    }
};