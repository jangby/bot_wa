const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'meme',
    description: 'Kirim gambar meme hits Indonesia',
    async execute(client, msg, args) {
        // Beri reaksi jam pasir
        await msg.react('⏳');

        try {
            // 1. Ambil 20 meme sekaligus dari komunitas meme Indonesia (r/aku_ddn)
            const apiUrl = 'https://meme-api.com/gimme/aku_ddn/20';
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error('Server Meme Sedang Down');
            const data = await response.json();

            if (!data || !data.memes || data.memes.length === 0) {
                throw new Error('Data gambar tidak ditemukan');
            }

            // 2. FILTER MEME BERKELAS
            // - Singkirkan gambar sensitif (NSFW/Spoiler)
            // - Urutkan berdasarkan jumlah Upvotes (Likes) dari yang paling tinggi ke rendah
            const memeBerkelas = data.memes
                .filter(m => !m.nsfw && !m.spoiler) 
                .sort((a, b) => b.ups - a.ups); 

            // 3. Ambil salah satu dari 5 meme terbaik di batch ini (biar nggak dikirim yang itu-itu aja)
            const top5Memes = memeBerkelas.slice(0, 5);
            const memeHits = top5Memes[Math.floor(Math.random() * top5Memes.length)];

            if (!memeHits || !memeHits.url) throw new Error('Meme berkelas tidak ditemukan saat ini');

            // 4. Ubah link gambar menjadi format Media WhatsApp
            const media = await MessageMedia.fromUrl(memeHits.url, { unsafeMime: true });

            // 5. Susun pesan balasan (Tampilkan jumlah Likes-nya sebagai bukti kalau ini hits)
            const captionMeme = `🤣 *${memeHits.title}*\n\n🔥 *Suhu Meme:* ${memeHits.ups} Likes | _Sumber: r/${memeHits.subreddit}_`;

            // 6. Kirim meme ke grup
            await msg.reply(media, null, { caption: captionMeme });
            
            // Beri centang hijau
            await msg.react('✅');

        } catch (error) {
            console.error('Error Meme API:', error);
            await msg.react('❌');
            msg.reply('❌ Yah, gagal berburu meme hits saat ini. Servernya lagi sibuk, coba bentar lagi ya!');
        }
    }
};