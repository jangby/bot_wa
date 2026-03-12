const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tovn',
    description: 'Ubah Video atau Audio yang di-reply menjadi Voice Note (VN)',
    async execute(client, msg, args) {
        try {
            // 1. Cek apakah user me-reply sebuah pesan
            if (!msg.hasQuotedMsg) {
                return msg.reply('❌ Kamu harus *me-reply (membalas)* pesan audio atau video dengan mengetik *!tovn*');
            }

            // Beri reaksi jam pasir tanda bot sedang memproses
            await msg.react('⏳');

            // 2. Ambil pesan yang di-reply
            const quotedMsg = await msg.getQuotedMessage();

            // 3. Pastikan pesan yang di-reply ada file medianya
            if (!quotedMsg.hasMedia) {
                await msg.react('❌');
                return msg.reply('❌ Pesan yang kamu reply tidak mengandung audio atau video.');
            }

            // 4. Download media dari pesan yang di-reply
            const media = await quotedMsg.downloadMedia();

            if (!media) {
                await msg.react('❌');
                return msg.reply('❌ Gagal mengunduh media dari pesan tersebut. Coba lagi.');
            }

            // 5. Pastikan formatnya adalah audio atau video
            if (!media.mimetype.includes('audio') && !media.mimetype.includes('video')) {
                await msg.react('❌');
                return msg.reply('❌ Format tidak didukung! Yang di-reply harus berupa Audio atau Video.');
            }

            // 6. Kirim kembali sebagai Voice Note
            await client.sendMessage(msg.from, media, { 
                sendAudioAsVoice: true 
            });

            // Beri reaksi centang kalau sukses
            await msg.react('✅');

        } catch (error) {
            console.error('Error command tovn:', error);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan sistem. Cek terminal/console untuk melihat detail errornya.');
        }
    }
};