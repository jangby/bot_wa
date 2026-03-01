module.exports = {
    name: 'ping', // Nama perintah (!ping)
    description: 'Cek status bot',
    async execute(client, msg, args, { chat, contact }) {
        // Logika perintah di sini
        await msg.reply('🏓 Pong! Bot Modular siap digunakan.');
    }
};