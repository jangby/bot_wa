const googleTTS = require('google-tts-api');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tts',
    description: 'Ubah teks jadi suara Google',
    async execute(client, msg, args) {
        const text = args.join(' ');
        if (!text) return msg.reply('❌ Masukkan teksnya! Contoh: *!tts Halo semua*');

        // Batasi panjang teks agar tidak error (Google TTS via Base64 maksimal 200 karakter)
        if (text.length > 200) {
            return msg.reply('❌ Teks terlalu panjang! Maksimal 200 karakter.');
        }

        try {
            // Gunakan getAudioBase64 alih-alih getAudioUrl
            const base64Audio = await googleTTS.getAudioBase64(text, {
                lang: 'id',
                slow: false,
                host: 'https://translate.google.com',
                timeout: 10000,
            });

            // Buat objek media dari base64 dengan spesifikasi audio/mp3
            const media = new MessageMedia('audio/mp3', base64Audio, 'tts.mp3');

            // Kirim sebagai Voice Note
            await client.sendMessage(msg.from, media);

        } catch (error) {
            console.error('Error TTS:', error.message);
            msg.reply('❌ Gagal membuat suara. Silakan coba lagi nanti.');
        }
    }
};