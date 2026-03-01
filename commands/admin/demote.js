module.exports = {
    name: 'demote',
    description: 'Cabut jabatan Admin',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Kamu bukan Admin!');

        const botId = client.info.wid._serialized;
        const bot = chat.participants.find(p => p.id._serialized === botId);
        if (!bot.isAdmin) return msg.reply('❌ Jadikan saya Admin dulu!');

        if (msg.mentionedIds.length === 0) return msg.reply('❌ Tag orangnya!');

        await chat.demoteParticipants(msg.mentionedIds);
        msg.reply('✅ Sukses! Jabatan Admin dicabut.');
    }
};