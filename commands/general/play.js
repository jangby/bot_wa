const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Mencari dan memutar lagu dari YouTube (Multi-Server)',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan judul lagunya bro!\n\n*Contoh:* !play bahagia lagi');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply(`Tunggu ya, lagi nyari lagu *"${query}"* di gudang lagu... 🎧`);

        try {
            // 1. CARI LAGU DI YOUTUBE
            const searchRes = await fetch(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`);
            const searchData = await searchRes.json();

            if (!searchData.status || !searchData.data || searchData.data.length === 0) {
                throw new Error('Lagunya nggak ketemu di YouTube nih.');
            }

            const video = searchData.data[0];
            const videoUrl = video.url;
            const videoTitle = video.title;

            let mp3Url = null;

            // ========================================================
            // SISTEM FALLBACK DOWNLOADER
            // ========================================================

            // PERCOBAAN 1: Pakai API AEMT (Sangat stabil buat YT)
            try {
                const res1 = await fetch(`https://api.aemt.me/youtube?url=${encodeURIComponent(videoUrl)}`);
                const data1 = await res1.json();
                if (data1.status && data1.result && data1.result.mp3) {
                    mp3Url = data1.result.mp3;
                    console.log('Sukses via API 1 (AEMT)');
                }
            } catch (e) { console.log('API 1 Gagal'); }

            // PERCOBAAN 2: Jika API 1 Gagal, balik ke Siputzx tapi dengan endpoint berbeda
            if (!mp3Url) {
                try {
                    const res2 = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`);
                    const data2 = await res2.json();
                    if (data2.status && data2.data && data2.data.dl) {
                        mp3Url = data2.data.dl;
                        console.log('Sukses via API 2 (Siputzx)');
                    }
                } catch (e) { console.log('API 2 Gagal'); }
            }

            if (!mp3Url) {
                throw new Error('Semua server pengunduh lagu lagi sibuk. Coba lagi nanti ya!');
            }

            // ========================================================
            // PROSES PENGIRIMAN
            // ========================================================

            const media = await MessageMedia.fromUrl(mp3Url, { unsafeMime: true, filename: `${videoTitle}.mp3` });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(`🎶 *Ditemukan:* ${videoTitle}\n\nSedang mengirim audio...`);

            // Kirim sebagai VN (Voice Note)
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Error Play Music:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Gagal memutar lagu.\n*Info:* ${error.message}`);
        }
    }
};