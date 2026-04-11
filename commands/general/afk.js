module.exports = {
    name: 'afk',
    description: 'Set status AFK (Away From Keyboard) di Grup',
    type: 'group', // Hanya boleh di grup
    async execute(client, msg, args) {
        const chat = await msg.getChat();
        if (!chat.isGroup) {
            return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');
        }

        const senderId = msg.author || msg.from; // Ambil ID pengirim
        const reason = args.length > 0 ? args.join(' ') : 'Tanpa alasan / Sedang sibuk';

        // Simpan data AFK ke dalam memori global
        global.afkMap.set(senderId, {
            reason: reason,
            time: Date.now()
        });

        let text = `💤 *STATUS AFK AKTIF* 💤\n\n`;
        text += `Kamu sekarang sedang AFK.\n*Alasan:* ${reason}\n\n`;
        text += `_Siapapun yang tag atau membalas pesanmu akan diblacklist oleh bot selama 5 menit. Kirim pesan apa saja di grup ini untuk membatalkan status AFK._`;

        await msg.reply(text);
    }
};