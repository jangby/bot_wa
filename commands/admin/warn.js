const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
    name: 'warn',
    description: 'Beri peringatan ke anggota',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya Admin!');
        if (msg.mentionedIds.length === 0) return msg.reply('❌ Tag orangnya! Contoh: *!warn @Budi Spam*');

        const targetId = msg.mentionedIds[0];
        
        // Cek Anti-Warn ke Owner/Admin
        if (config.sudoUsers.includes(targetId)) return msg.reply('⚠️ Tidak bisa warn Owner!');
        
        const targetParticipant = chat.participants.find(p => p.id._serialized === targetId);
        if (targetParticipant && (targetParticipant.isAdmin || targetParticipant.isSuperAdmin)) {
            return msg.reply('⚠️ Sesama Admin dilarang saling warn!');
        }

        const alasan = args.slice(1).join(' ') || 'Melanggar aturan';
        const dbPath = path.join(__dirname, '../../data/warn.json');
        
        // Baca Database
        let db = JSON.parse(fs.readFileSync(dbPath));
        if (!db[chat.id._serialized]) db[chat.id._serialized] = {};
        if (!db[chat.id._serialized][targetId]) db[chat.id._serialized][targetId] = 0;

        // Tambah Warn
        db[chat.id._serialized][targetId] += 1;
        const jumlahWarn = db[chat.id._serialized][targetId];
        
        // Simpan
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Cek Limit
        if (jumlahWarn >= 3) {
            // Reset warn
            delete db[chat.id._serialized][targetId];
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            // Cek apakah bot admin sebelum kick
            const botId = client.info.wid._serialized;
            const bot = chat.participants.find(p => p.id._serialized === botId);
            
            if (bot.isAdmin) {
                await chat.removeParticipants([targetId]);
                await chat.sendMessage(`🚨 *@${targetId.split('@')[0]}* telah mencapai 3x Peringatan dan dikeluarkan otomatis!`, { mentions: [targetId] });
            } else {
                msg.reply(`⚠️ Target sudah kena 3x Warn! Tolong kick manual karena bot bukan Admin.`);
            }
        } else {
            msg.reply(`⚠️ *PERINGATAN KE-${jumlahWarn}/3*\n\nTarget: @${targetId.split('@')[0]}\nAlasan: ${alasan}`, { mentions: [targetId] });
        }
    }
};