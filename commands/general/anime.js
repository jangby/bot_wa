const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'anime',
    description: 'Cari informasi dan link nonton anime',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan judul anime!\nContoh: *!anime jujutsu kaisen*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari data anime...');

        try {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;
            const response = await axios.get(url);
            const data = response.data.data;

            if (!data || data.length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Anime dengan judul *${query}* tidak ditemukan.`);
            }

            const anime = data[0];
            const encodedTitle = encodeURIComponent(anime.title);

            // ==========================================
            // 📺 LOGIKA SMART STREAMING LINKS (REVISI)
            // ==========================================
            let streamingLinks = '\n\n📺 *Tonton Anime Ini Di:*\n';
            
            // Cek apakah API memberikan link resmi (Crunchyroll, Netflix, dll)
            let hasOfficialLinks = false;
            if (anime.streaming && anime.streaming.length > 0) {
                anime.streaming.forEach(platform => {
                    // Filter agar tidak memasukkan link luar yang tidak relevan di Indonesia
                    if (platform.name.includes('Netflix') || platform.name.includes('Crunchyroll') || platform.name.includes('Bilibili')) {
                        streamingLinks += `> 🟢 *${platform.name}:* ${platform.url}\n`;
                        hasOfficialLinks = true;
                    }
                });
            }

            // Jika tidak ada link resmi dari API, bot otomatis membuatkan Smart Search Links
            if (!hasOfficialLinks) {
                streamingLinks += `> 🔵 *Bstation:* https://www.bilibili.tv/id/search-result?q=${encodedTitle}\n`;
                streamingLinks += `> 🔴 *YouTube:* https://www.youtube.com/results?search_query=${encodedTitle}+muse+indonesia\n`;
                streamingLinks += `> 🌐 *Google:* https://www.google.com/search?q=Nonton+Anime+${encodedTitle}+Sub+Indo\n`;
            }

            let statusIndo = anime.status;
            if (anime.status === 'Finished Airing') statusIndo = 'Tamat';
            if (anime.status === 'Currently Airing') statusIndo = 'Sedang Tayang (Ongoing)';
            if (anime.status === 'Not yet aired') statusIndo = 'Belum Tayang';

            let text = `🎬 *INFO ANIME* 🎬\n\n`;
            text += `*Judul:* ${anime.title} ${anime.title_english ? `(${anime.title_english})` : ''}\n`;
            text += `*Tipe:* ${anime.type || 'N/A'}\n`;
            text += `*Episode:* ${anime.episodes || '?'} Episode\n`;
            text += `*Status:* ${statusIndo}\n`;
            text += `*Rating:* ⭐ ${anime.score || 'N/A'}/10\n`;
            text += `${streamingLinks}\n\n`;
            
            let synopsis = anime.synopsis ? anime.synopsis.replace('[Written by MAL Rewrite]', '').trim() : 'Tidak ada sinopsis.';
            if (synopsis.length > 500) synopsis = synopsis.substring(0, 500) + '... (baca selengkapnya di MyAnimeList)';
            
            text += `📝 *Sinopsis (Inggris):*\n_${synopsis}_`;

            if (anime.images && anime.images.jpg.large_image_url) {
                const media = await MessageMedia.fromUrl(anime.images.jpg.large_image_url);
                await client.sendMessage(msg.from, media, { caption: text });
            } else {
                await msg.reply(text);
            }

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Anime:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat menghubungi server.').catch(()=>{});
        }
    }
};