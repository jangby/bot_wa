const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'on',
    description: 'Hidupkan bot kembali',
    async execute(client, msg, args, { isOwner }) {
        if (!isOwner) return; // Diam saja kalau bukan owner

        const dbPath = path.join(__dirname, '../../data/settings.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (db.bot_active) return msg.reply('🟢 Bot sudah aktif kok.');

        db.bot_active = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply('🟢 *BOT DIAKTIFKAN KEMBALI*\nSilakan gunakan bot seperti biasa.');
    }
};