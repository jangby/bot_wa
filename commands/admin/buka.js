const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'buka',
    description: 'Mengubah foto/video sekali lihat (View Once) menjadi pesan biasa',
    async execute(client, msg, args) {
        // 1. Cek apakah pesan yang dibalas (quoted) ada
        if (!msg.hasQuotedMsg) {
            return msg.reply('⚠️ Balas (reply) foto atau video sekali lihat yang mau dibuka!');
        }

        const quotedMsg = await msg.getQuotedMessage();

        // 2. Cek apakah itu benar-benar media sekali lihat
        // Kita cek properti _data.isViewOnce (properti internal whatsapp-web.js)
        if (!quotedMsg.hasMedia || !quotedMsg._data.isViewOnce) {
            return msg.reply('❌ Itu bukan media sekali lihat (View Once).');
        }

        await msg.react('⏳');

        try {
            // 3. Download media tersebut
            // Bot akan mencoba mengambil buffer mentah sebelum dihapus server
            const media = await quotedMsg.downloadMedia();

            if (!media) {
                throw new Error('Gagal mengunduh media. Mungkin sudah kadaluarsa atau sudah dibuka.');
            }

            // 4. Kirim kembali ke chat tanpa mode View Once
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Berhasil Membuka Media Sekali Lihat*\n\n_Media ini sekarang bisa kamu simpan atau lihat berkali-kali._`,
                quotedMessageId: msg.id._serialized // Agar membalas chat user
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error Buka View Once:', error);
            await msg.react('❌');
            msg.reply('❌ Gagal membuka media.\n\n*Pesan:* ' + error.message);
        }
    }
};