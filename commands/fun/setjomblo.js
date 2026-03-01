const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setjomblo',
    description: 'Set sejak kapan kamu jomblo',
    async execute(client, msg, args, { contact }) {
        if (args.length === 0) return msg.reply('❌ Format: *!setjomblo DD-MM-YYYY*\nContoh: *!setjomblo 01-01-2023*');

        const tgl = args[0];
        if (!tgl.match(/^\d{2}-\d{2}-\d{4}$/)) return msg.reply('❌ Format salah! Harus DD-MM-YYYY');

        const dbPath = path.join(__dirname, '../../data/jomblo.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        db[contact.id._serialized] = tgl;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply('💔 Data kesendirian berhasil disimpan. Yang sabar ya...');
    }
};