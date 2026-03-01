module.exports = {
    name: 'bukagrup',
    description: 'Buka grup untuk semua anggota',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Kamu bukan Admin!');

        const botId = client.info.wid._serialized;
        const bot = chat.participants.find(p => p.id._serialized === botId);
        if (!bot.isAdmin) return msg.reply('❌ Jadikan saya Admin dulu!');

        await chat.setMessagesAdminsOnly(false);
        msg.reply('🔓 *Grup Dibuka!* Silakan meramaikan kembali.');
    }
};