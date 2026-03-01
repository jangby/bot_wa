const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'jomblo',
    description: 'Hitung durasi menjomblo',
    async execute(client, msg, args, { contact }) {
        const dbPath = path.join(__dirname, '../../data/jomblo.json');
        const db = JSON.parse(fs.readFileSync(dbPath));
        const targetId = msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : contact.id._serialized;

        if (!db[targetId]) return msg.reply('❌ Belum set tanggal jomblo. Ketik *!setjomblo*');

        const [hari, bulan, tahun] = db[targetId].split('-');
        const start = new Date(tahun, parseInt(bulan) - 1, hari);
        const now = new Date();

        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        msg.reply(`💔 *DURASI JOMBLO* 💔\n\n📅 Sejak: ${db[targetId]}\n😢 Sudah sendiri selama: *${diffDays} Hari*`);
    }
};