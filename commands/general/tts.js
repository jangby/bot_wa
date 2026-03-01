const googleTTS = require('google-tts-api');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tts',
    description: 'Ubah teks jadi suara Google',
    async execute(client, msg, args) {
        const text = args.join(' ');
        if (!text) return msg.reply('❌ Masukkan teksnya! Contoh: *!tts Halo semua*');

        try {
            // Generate URL Audio (Bahasa Indonesia)
            const url = googleTTS.getAudioUrl(text, {
                lang: 'id',
                slow: false,
                host: 'https://translate.google.com',
            });

            // Kirim sebagai Voice Note
            const media = await MessageMedia.fromUrl(url, { unsafeMime: true });
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });

        } catch (error) {
            console.error(error);
            msg.reply('❌ Gagal membuat suara. Teks mungkin terlalu panjang.');
        }
    }
};