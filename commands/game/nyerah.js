module.exports = {
    name: 'nyerah',
    description: 'Hentikan game yang sedang berjalan',
    async execute(client, msg, args, { chat }) {
        if (client.gameStates[chat.id._serialized]) {
            delete client.gameStates[chat.id._serialized];
            msg.reply('🏳️ Game berhasil dihentikan paksa.');
        } else {
            msg.reply('❌ Tidak ada game yang berjalan.');
        }
    }
};