const axios = require('axios');

module.exports = {
    name: 'translate',
    description: 'Terjemahkan pesan (Reply pesan atau ketik langsung)',
    type: 'general',
    async execute(client, msg, args) {
        try {
            let textToTranslate = '';
            let targetLang = args[0] || 'id'; // Default ke Bahasa Indonesia

            // Cek apakah user me-reply pesan
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                textToTranslate = quotedMsg.body;
            } else if (args.length > 1) {
                // Jika tidak me-reply, ambil dari teks setelah kode bahasa (!translate en selamat pagi)
                targetLang = args[0];
                textToTranslate = args.slice(1).join(' ');
            } else {
                return msg.reply('❌ Reply pesan yang mau diterjemahkan dengan *!translate id* atau *!translate en*');
            }

            await msg.react('⏳');

            // Menggunakan endpoint publik Google Translate (Gratis & Tanpa Key)
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            const response = await axios.get(url);
            
            // Mengambil hasil terjemahan dari array response Google
            const translation = response.data[0][0][0];

            await msg.reply(`🌐 *Google Translate*\n\nTerjemahan (${targetLang}):\n_${translation}_`);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Translate:', error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal menerjemahkan teks.');
        }
    }
};