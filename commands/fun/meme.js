const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'meme',
    description: 'Kirim gambar meme random lucu (Global & Indo)',
    async execute(client, msg, args) {
        // Beri reaksi jam pasir
        await msg.react('⏳');

        try {
            // 1. Tentukan sumber Meme (Default: Global)
            let apiUrl = 'https://meme-api.com/gimme';

            // Jika user mengetik "!meme indo", kita arahkan ke forum meme Indonesia (r/aku_ddn atau r/indonesia)
            if (args.length > 0 && args[0].toLowerCase() === 'indo') {
                apiUrl = 'https://meme-api.com/gimme/aku_ddn'; 
            }

            // 2. Tembak API-nya
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Gagal menghubungi server Meme (HTTP ${response.status})`);
            }

            const data = await response.json();

            // Cek jika API tidak mengembalikan link gambar
            if (!data || !data.url) {
                throw new Error('Data gambar tidak ditemukan');
            }

            // 3. Ubah link gambar menjadi format Media WhatsApp
            const media = await MessageMedia.fromUrl(data.url, { unsafeMime: true });

            // 4. Susun pesan balasan (Sertakan judul candaannya)
            const captionMeme = `🤣 *${data.title}*\n\n_Sumber: r/${data.subreddit}_`;

            // 5. Kirim meme ke grup
            await msg.reply(media, null, { caption: captionMeme });
            
            // Beri centang hijau
            await msg.react('✅');

        } catch (error) {
            console.error('Error Meme API:', error);
            await msg.react('❌');
            msg.reply('❌ Gagal mengambil meme saat ini. Coba lagi dalam beberapa saat ya!');
        }
    }
};