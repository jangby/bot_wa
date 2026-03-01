const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'loker',
    description: 'Info lowongan kerja',
    async execute(client, msg, args) {
        const dbPath = path.join(__dirname, '../../data/loker.json');
        const lokerList = JSON.parse(fs.readFileSync(dbPath));

        if (lokerList.length === 0) return msg.reply('📭 Belum ada info loker saat ini.');

        let text = `💼 *PORTAL LOKER* 💼\n\n`;
        lokerList.forEach((l, i) => {
            text += `*${i + 1}.* ${l.info}\n_(Dishare oleh: ${l.sender} pada ${l.date})_\n\n`;
        });
        text += `_Ketik !addloker [info] untuk menambah._\n_Ketik !delloker [nomor] untuk menghapus._`;

        msg.reply(text);
    }
};