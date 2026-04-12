const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'anime',
    description: 'Cari informasi dan link nonton anime',
    type: 'general', // Bisa dipakai di PC dan Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan judul anime yang ingin dicari!\nContoh: *!anime jujutsu kaisen*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari data anime...');

        try {
            // Menggunakan Jikan API (MyAnimeList) yang gratis, legal, dan sangat stabil
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;
            const response = await axios.get(url);
            
            const data = response.data.data;

            // Jika anime tidak ditemukan
            if (!data || data.length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Anime dengan judul *${query}* tidak ditemukan. Coba gunakan ejaan yang lebih spesifik.`);
            }

            const anime = data[0];

            // Mengambil daftar link streaming resmi jika tersedia
            let streamingLinks = '';
            if (anime.streaming && anime.streaming.length > 0) {
                streamingLinks = '\n\n📺 *Tersedia di Platform Resmi:*\n';
                anime.streaming.forEach(platform => {
                    streamingLinks += `> ${platform.name}: ${platform.url}\n`;
                });
            } else {
                streamingLinks = '\n\n📺 *Tersedia di Platform Resmi:*\n> Belum ada data platform resmi untuk region ini.';
            }

            // Menerjemahkan status ke Bahasa Indonesia
            let statusIndo = anime.status;
            if (anime.status === 'Finished Airing') statusIndo = 'Tamat';
            if (anime.status === 'Currently Airing') statusIndo = 'Sedang Tayang (Ongoing)';
            if (anime.status === 'Not yet aired') statusIndo = 'Belum Tayang';

            // Susun teks balasan
            let text = `🎬 *INFO ANIME* 🎬\n\n`;
            text += `*Judul:* ${anime.title} ${anime.title_english ? `(${anime.title_english})` : ''}\n`;
            text += `*Tipe:* ${anime.type || 'N/A'}\n`;
            text += `*Episode:* ${anime.episodes || '?'} Episode\n`;
            text += `*Status:* ${statusIndo}\n`;
            text += `*Rating:* ⭐ ${anime.score || 'N/A'}/10\n`;
            text += `${streamingLinks}\n\n`;
            
            // Batasi panjang sinopsis agar tidak menuh-menuhin layar (maks 500 karakter)
            let synopsis = anime.synopsis ? anime.synopsis.replace('[Written by MAL Rewrite]', '').trim() : 'Tidak ada sinopsis.';
            if (synopsis.length > 500) synopsis = synopsis.substring(0, 500) + '... (baca selengkapnya di MyAnimeList)';
            
            text += `📝 *Sinopsis (Inggris):*\n_${synopsis}_`;

            // Kirim beserta poster gambarnya
            if (anime.images && anime.images.jpg.large_image_url) {
                const media = await MessageMedia.fromUrl(anime.images.jpg.large_image_url);
                await client.sendMessage(msg.from, media, { caption: text });
            } else {
                // Kalau tidak ada poster, kirim teks saja
                await msg.reply(text);
            }

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Anime:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat menghubungi server MyAnimeList. Coba beberapa saat lagi.').catch(()=>{});
        }
    }
};