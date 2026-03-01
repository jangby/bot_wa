const config = require('../../config');
const uang = require('../../utils/uang'); // Import uang

module.exports = {
    name: 'kick',
    description: 'Keluarkan anggota dari grup',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // ... (Validasi Admin & Grup sama seperti sebelumnya) ...
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Kamu bukan Admin!');
        if (msg.mentionedIds.length === 0) return msg.reply('❌ Tag orangnya!');

        const targetId = msg.mentionedIds[0];

        // ... (Validasi Anti-Owner & Anti-Admin tetap sama) ...
        if (config.sudoUsers.includes(targetId)) return msg.reply('⚠️ Owner tidak bisa di-kick.');

        // 🔥 LOGIKA PERISAI (BARU) 🔥
        const invTarget = uang.cekInventory(targetId);
        
        if (invTarget['perisai'] && invTarget['perisai'] > 0) {
            // Kurangi perisai (Hancur)
            uang.useItem(targetId, 'perisai');
            
            return msg.reply(`🛡️ *KICK GAGAL!*\nTarget @${targetId.split('@')[0]} menggunakan item **PERISAI**! Perisainya hancur menyelamatkan nyawanya.`, { mentions: [targetId] });
        }
        
        // Eksekusi Kick (Jika tidak punya perisai)
        try {
            await chat.removeParticipants([targetId]);
            msg.reply('✅ Anggota berhasil dikeluarkan.');
        } catch (e) {
            msg.reply('❌ Gagal kick. Pastikan bot adalah Admin.');
        }
    }
};