const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kapsulwaktu',
    description: 'Tulis pesan untuk masa depan',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya di grup!');
        
        // Format: !kapsulwaktu [durasi_hari] [pesan]
        if (args.length < 2) return msg.reply('❌ Format: *!kapsulwaktu [hari] [pesan]*\nContoh: *!kapsulwaktu 30 Hai aku dari masa lalu*');

        const hari = parseInt(args[0]);
        const pesan = args.slice(1).join(' ');

        if (isNaN(hari)) return msg.reply('❌ Durasi harus angka (hari)!');

        const dbPath = path.join(__dirname, '../../data/kapsul.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        const openDate = Date.now() + (hari * 24 * 60 * 60 * 1000);
        
        db.push({
            from: contact.pushname || contact.number,
            chatId: chat.id._serialized,
            message: pesan,
            openDate: openDate,
            dateString: new Date(openDate).toLocaleDateString('id-ID')
        });

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`🔒 *KAPSUL WAKTU TERSIMPAN*\n\nPesan ini terkunci dan baru bisa dibuka pada tanggal: *${new Date(openDate).toLocaleDateString('id-ID')}*\n\nGunakan *!bukakapsul* nanti.`);
    }
};