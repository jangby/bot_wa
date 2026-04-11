const axios = require('axios');

module.exports = {
    name: 'lirik',
    description: 'Cari lirik lagu',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan judul lagu! Contoh: *!lirik in the stars benson boone*');
        }

        // Gabungkan argumen menjadi kata kunci
        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // Menggunakan API publik gratis yang sangat stabil untuk bot
            const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
            
            const response = await axios.get(url);
            const data = response.data;

            // Jika API merespons tapi lirik kosong
            if (!data || !data.lyrics) {
                return msg.reply(`❌ Lirik untuk lagu *${query}* tidak ditemukan. Coba pastikan ejaan judulnya benar.`);
            }

            // Susun pesan balasan yang rapi
            let text = `🎶 *LIRIK LAGU* 🎶\n\n`;
            text += `*Judul:* ${data.title}\n`;
            text += `*Artis:* ${data.author}\n\n`;
            text += `_${data.lyrics}_`; 

            // Kirim pesan ke obrolan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Lirik:', error.message);
            await msg.react('❌');
            
            // Error 404 dari API artinya lagu benar-benar tidak ada di database mereka
            if (error.response && error.response.status === 404) {
                msg.reply(`❌ Lirik untuk *${query}* tidak ditemukan di database.`);
            } else {
                msg.reply('❌ Terjadi kesalahan saat menghubungi server pencarian lirik. Coba lagi nanti.');
            }
        }
    }
};