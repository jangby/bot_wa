const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gelar',
    description: 'Berikan gelar ke orang lain',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya di grup!');
        if (msg.mentionedIds.length === 0) return msg.reply('❌ Tag orangnya! Contoh: *!gelar @Budi Tukang Tidur*');
        
        const targetId = msg.mentionedIds[0];
        const giverId = contact.id._serialized;
        
        // Aturan: Tidak boleh kasih gelar ke diri sendiri
        if (targetId === giverId) return msg.reply('❌ Gak bisa kasih gelar ke diri sendiri dong, narsis amat!');

        const gelarBaru = args.slice(1).join(' '); // Ambil teks setelah tag
        if (!gelarBaru) return msg.reply('❌ Masukkan nama gelarnya!');

        const dbPath = path.join(__dirname, '../../data/gelar.json');
        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db[targetId]) db[targetId] = [];
        
        // Simpan gelar
        db[targetId].push(gelarBaru);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`✅ Gelar *"${gelarBaru}"* resmi disematkan kepada @${targetId.split('@')[0]}!`, { mentions: [targetId] });
    }
};