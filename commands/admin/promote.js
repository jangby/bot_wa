module.exports = {
    name: 'promote',
    description: 'Jadikan anggota sebagai Admin',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Kamu bukan Admin!');

        // Cek Bot Admin
        const botId = client.info.wid._serialized;
        const bot = chat.participants.find(p => p.id._serialized === botId);
        if (!bot.isAdmin) return msg.reply('❌ Jadikan saya Admin dulu!');

        if (msg.mentionedIds.length === 0) return msg.reply('❌ Tag orangnya! Contoh: *!promote @Budi*');

        await chat.promoteParticipants(msg.mentionedIds);
        msg.reply('✅ Sukses! Anggota kini menjadi Admin.');
    }
};