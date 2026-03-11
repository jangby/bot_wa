const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Play music via High-Speed API',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagu!');

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply(`🎧 Mencari *"${query}"*...`);

        try {
            // Kita gunakan API pengunduh yang langsung mencari & mengonversi
            // Ini adalah salah satu API paling stabil saat ini (AlyaChan)
            const apiRes = await fetch(`https://api.alyachan.pro/api/ytmp3?url=${encodeURIComponent(query)}&apikey=GataDios`);
            const json = await apiRes.json();

            if (!json.status || !json.data || !json.data.url) {
                // Jika gagal, coba API Global (Dandymods)
                const res2 = await fetch(`https://api.dandymods.xyz/api/ytmp3?url=${encodeURIComponent(query)}`);
                const json2 = await res2.json();
                
                if (!json2.status || !json2.result.url) throw new Error('Semua server sedang sibuk.');
                
                var downloadUrl = json2.result.url;
                var title = json2.result.title;
            } else {
                var downloadUrl = json.data.url;
                var title = json.data.title;
            }

            const media = await MessageMedia.fromUrl(downloadUrl, { 
                unsafeMime: true, 
                filename: `${title}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error(error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal memutar lagu. YouTube sedang memperketat keamanan, coba lagi nanti atau gunakan judul lain.');
        }
    }
};