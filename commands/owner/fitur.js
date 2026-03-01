const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'fitur',
    description: 'Nyalakan/Matikan fitur atau perintah',
    async execute(client, msg, args, { isOwner }) {
        if (!isOwner) return msg.reply('❌ Kamu bukan Owner!');

        if (args.length < 2) {
            return msg.reply('❌ Format: *!fitur [nama] [on/off]*\nContoh: *!fitur antilink off*');
        }

        const featureName = args[0].toLowerCase();
        const state = args[1].toLowerCase(); // 'on' atau 'off'

        // Daftar fitur sistem (bukan command) yang valid
        const systemFeatures = ['antilink', 'antikasar', 'antivirtex'];

        // Cek validitas: Harus ada di daftar Command ATAU daftar fitur sistem
        if (!client.commands.has(featureName) && !systemFeatures.includes(featureName)) {
            return msg.reply(`❌ Fitur/Perintah *${featureName}* tidak ditemukan.`);
        }

        // Jangan izinkan mematikan fitur sakral
        if (['fitur', 'on', 'off'].includes(featureName)) {
            return msg.reply('⚠️ Perintah sakral tidak boleh dimatikan!');
        }

        const dbPath = path.join(__dirname, '../../data/settings.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (state === 'off') {
            if (!db.disabled_commands.includes(featureName)) {
                db.disabled_commands.push(featureName);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                msg.reply(`🚫 Fitur *${featureName}* berhasil DIMATIKAN.`);
            } else {
                msg.reply(`⚠️ Fitur *${featureName}* sudah mati sebelumnya.`);
            }
        } else if (state === 'on') {
            if (db.disabled_commands.includes(featureName)) {
                db.disabled_commands = db.disabled_commands.filter(c => c !== featureName);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                msg.reply(`✅ Fitur *${featureName}* berhasil DIAKTIFKAN kembali.`);
            } else {
                msg.reply(`⚠️ Fitur *${featureName}* memang sudah aktif.`);
            }
        } else {
            msg.reply('❌ Pilihan hanya *on* atau *off*.');
        }
    }
};