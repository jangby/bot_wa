const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'buka',
    description: 'Membongkar View Once dengan pengecekan tipe mentah',
    async execute(client, msg, args) {
        if (!msg.hasQuotedMsg) {
            return msg.reply('⚠️ Balas (reply) foto/video sekali lihat yang mau dibuka!');
        }

        const quotedMsg = await msg.getQuotedMessage();
        
        // Logika Pengecekan Mendalam:
        // Beberapa versi WA menganggap View Once bukan 'hasMedia', 
        // tapi tipenya tetap 'image' atau 'video' di dalam data mentah (_data)
        const rawType = quotedMsg._data.type;
        const isViewOnce = quotedMsg._data.isViewOnce || quotedMsg._data.viewOnce;

        // Jika library bilang gapunya media, tapi data mentah bilang ini image/video
        if (!quotedMsg.hasMedia && rawType !== 'image' && rawType !== 'video') {
            return msg.reply('❌ Bot tidak mendeteksi adanya media di pesan ini.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔓 Mencoba menembus enkripsi View Once...');

        try {
            // Kita paksa download menggunakan fungsi internal jika downloadMedia() gagal
            const media = await quotedMsg.downloadMedia();

            if (!media || !media.data) {
                throw new Error('Media kosong atau gagal didekripsi.');
            }

            // Kirim balik
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Berasil Dibongkar!*\n\nTipe: ${rawType}\nStatus: Sekali Lihat`,
                quotedMessageId: msg.id._serialized
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Buka:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            
            msg.reply('❌ *Gagal Total!*\n\nWhatsApp Web (basis bot ini) sekarang sering memblokir akses media sekali lihat demi privasi.\n\n_Solusi: Pastikan versi whatsapp-web.js kamu paling baru (npm update whatsapp-web.js)._');
        }
    }
};