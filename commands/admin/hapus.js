module.exports = {
    name: 'hapus',
    description: 'Hapus pesan orang lain (Delete for Everyone)',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya Admin!');

        // Cek Bot Admin
        const botId = client.info.wid._serialized;
        const bot = chat.participants.find(p => p.id._serialized === botId);
        if (!bot.isAdmin) return msg.reply('❌ Jadikan saya Admin dulu agar bisa menghapus pesan orang!');

        if (msg.hasQuotedMsg) {
            try {
                const quotedMsg = await msg.getQuotedMessage();
                await quotedMsg.delete(true); // true = delete for everyone
                await msg.react('✅');
            } catch (error) {
                msg.reply('❌ Gagal menghapus. Pesan mungkin sudah terlalu lama.');
            }
        } else {
            msg.reply('⚠️ Reply (balas) pesan yang ingin dihapus, lalu ketik *!hapus*');
        }
    }
};