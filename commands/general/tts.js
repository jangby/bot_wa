const googleTTS = require('google-tts-api');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tts',
    description: 'Ubah teks menjadi suara (Voice Note)',
    type: 'general',
    async execute(client, msg, args) {
        let textToSpeak = '';

        try {
            // 1. CEK JIKA USER ME-REPLY PESAN
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                // Ambil teks dari pesan yang dibalas
                textToSpeak = quotedMsg.body; 
            } 
            // 2. CEK JIKA USER MENGETIK LANGSUNG SETELAH PERINTAH
            else if (args.length > 0) {
                textToSpeak = args.join(' ');
            }

            // 3. JIKA TIDAK ADA TEKS SAMA SEKALI
            if (!textToSpeak || textToSpeak.trim() === '') {
                return msg.reply('❌ Caranya salah!\nKetik *!tts pesan kamu* atau balas (reply) pesan orang lain dengan mengetik *!tts*.');
            }

            // Batasan dari Google API (biasanya maksimal 200 karakter)
            if (textToSpeak.length > 200) {
                return msg.reply('❌ Teks terlalu panjang! Maksimal 200 karakter untuk diubah menjadi suara.');
            }

            // Beri reaksi proses
            await msg.react('⏳');

            // 4. GENERATE AUDIO MENGGUNAKAN GOOGLE TTS API
            // Karena di package.json kamu sudah ada "google-tts-api", kita gunakan getAudioBase64
            const base64Audio = await googleTTS.getAudioBase64(textToSpeak, {
                lang: 'id', // Bahasa Indonesia
                slow: false, // Kecepatan normal
                host: 'https://translate.google.com',
                timeout: 10000,
            });

            // 5. UBAH KE FORMAT MEDIA WHATSAPP
            const media = new MessageMedia('audio/mp3', base64Audio, 'tts.mp3');

            // 6. KIRIM SEBAGAI VOICE NOTE (VN)
            await client.sendMessage(msg.from, media, { 
                sendAudioAsVoice: true // Di-set true agar jadinya VN, bukan file MP3 biasa
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error fitur TTS:', error);
            msg.reply('❌ Gagal membuat suara. Pastikan teksnya valid atau coba lagi nanti.');
        }
    }
};