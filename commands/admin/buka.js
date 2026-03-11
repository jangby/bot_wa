const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'buka',
    description: 'Memaksa unduh media (Termasuk View Once)',
    async execute(client, msg, args) {
        // 1. Pastikan user membalas pesan
        if (!msg.hasQuotedMsg) {
            return msg.reply('⚠️ Balas (reply) foto/video sekali lihat yang mau dibuka!');
        }

        const quotedMsg = await msg.getQuotedMessage();

        // 2. Cek apakah ada media di pesan tersebut
        if (!quotedMsg.hasMedia) {
            return msg.reply('❌ Pesan yang kamu balas tidak mengandung media (foto/video).');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔓 Sedang mencoba membongkar media... mohon tunggu.');

        try {
            // 3. FORCE DOWNLOAD 
            // Kita langsung coba download tanpa cek status isViewOnce
            const media = await quotedMsg.downloadMedia();

            if (!media) {
                // Jika gagal, coba akses via data mentah (fallback)
                throw new Error('Gagal mengunduh. Media mungkin sudah dibuka atau sudah hilang dari server.');
            }

            // 4. Kirim kembali sebagai media biasa
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Media Berhasil Dibongkar!*`,
                quotedMessageId: msg.id._serialized
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Buka View Once:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            
            msg.reply('❌ *Gagal!* WhatsApp sekarang membatasi akses media sekali lihat pada perangkat tertaut (Web/Desktop).\n\n_Saran: Pastikan bot tidak sedang login di banyak tempat._');
        }
    }
};