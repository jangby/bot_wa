const uang = require('../../utils/uang');

module.exports = {
    name: 'speaker',
    description: 'Teriak di grup secara anonim',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return;
        if (!uang.useItem(contact.id._serialized, 'speaker')) return msg.reply('❌ Beli *Speaker* dulu!');

        const pesan = args.join(' ');
        if (!pesan) return msg.reply('❌ Mau teriak apa?');

        // Hapus pesan asli user biar rahasia
        try { await msg.delete(true); } catch(e) {}

        // Kirim pesan bot
        client.sendMessage(chat.id._serialized, `📢 *PENGUMUMAN*\n\n"${pesan.toUpperCase()}"\n\n_~ Dari Hamba Allah_`);
    }
};