const uang = require('../../utils/uang');

module.exports = {
    name: 'bom',
    description: 'Ledakkan grup (Fake Prank)',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya di grup!');
        
        // Cek Item
        if (!uang.useItem(contact.id._serialized, 'bom')) {
            return msg.reply('❌ Kamu tidak punya *Bom*! Beli di !toko.');
        }

        msg.reply('💣 *BOM DILETAKKAN!* MELEDAK DALAM 5 DETIK!');

        setTimeout(() => chat.sendMessage('5...'), 1000);
        setTimeout(() => chat.sendMessage('4...'), 2000);
        setTimeout(() => chat.sendMessage('3...'), 3000);
        setTimeout(() => chat.sendMessage('2...'), 4000);
        setTimeout(() => chat.sendMessage('1...'), 5000);
        
        setTimeout(() => {
            chat.sendMessage('💥 *DUARRRRRR!!* 💥\n\n(Ini cuma prank, tidak ada yang terluka, kecuali perasaanmu 🤣)');
        }, 6000);
    }
};