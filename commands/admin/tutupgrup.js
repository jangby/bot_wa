module.exports = {
    name: 'tutupgrup',
    description: 'Tutup grup (Hanya Admin bisa chat)',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Kamu bukan Admin!');

        const botId = client.info.wid._serialized;
        const bot = chat.participants.find(p => p.id._serialized === botId);
        if (!bot.isAdmin) return msg.reply('❌ Jadikan saya Admin dulu!');

        await chat.setMessagesAdminsOnly(true);
        msg.reply('🔒 *Grup Ditutup!* Hanya Admin yang bisa mengirim pesan.');
    }
};