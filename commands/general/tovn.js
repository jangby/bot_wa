const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tovn',
    description: 'Ubah Video atau Audio biasa menjadi Voice Note (VN)',
    async execute(client, msg, args) {
        try {
            let targetMsg = msg;

            // Cek apakah user me-reply pesan (misalnya me-reply video/mp3)
            if (msg.hasQuotedMsg) {
                targetMsg = await msg.getQuotedMessage();
            }

            // Pastikan pesan tersebut benar-benar memiliki media
            if (!targetMsg.hasMedia) {
                return msg.reply('❌ Kirim Video/Audio dengan caption *!tovn*, atau reply Video/Audio yang sudah ada dengan ketik *!tovn*');
            }

            // Berikan reaksi atau pesan proses agar user tahu bot sedang bekerja
            await msg.react('⏳');

            // Download media dari pesan Whatsapp
            const media = await targetMsg.downloadMedia();

            // Cek apakah medianya valid dan berupa audio/video
            if (!media || (!media.mimetype.includes('audio') && !media.mimetype.includes('video'))) {
                return msg.reply('❌ Format tidak didukung! Hanya bisa mengubah Video atau Audio (MP3/MP4).');
            }

            // Kirim ulang media tersebut ke chat sebagai Voice Note
            // Parameter `sendAudioAsVoice: true` yang akan mengubahnya jadi VN
            await client.sendMessage(msg.from, media, { 
                sendAudioAsVoice: true 
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error command tovn:', error);
            msg.reply('❌ Gagal mengubah ke VN. Pastikan durasi tidak terlalu panjang atau ukuran file tidak terlalu besar.');
        }
    }
};