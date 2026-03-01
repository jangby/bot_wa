const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'off',
    description: 'Matikan bot (Mode Tidur)',
    async execute(client, msg, args, { isOwner }) {
        if (!isOwner) return msg.reply('❌ Kamu bukan Owner!');

        const dbPath = path.join(__dirname, '../../data/settings.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db.bot_active) return msg.reply('💤 Bot sudah dalam keadaan mati.');

        db.bot_active = false;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply('💤 *BOT DIMATIKAN*\nBot tidak akan merespon perintah siapapun (kecuali Owner yang mengetik !on).');
    }
};