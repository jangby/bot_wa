const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Memutar lagu dengan API Private (Paling Stabil)',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Judul lagunya apa?\nContoh: *!play sial mahalini*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🎧 Sedang menyiapkan musik untukmu...');

        try {
            // 1. CARI INFO LAGU & VIDEO TERLEBIH DAHULU
            const searchRes = await fetch(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`);
            const searchData = await searchRes.json();

            if (!searchData.status || !searchData.data || searchData.data.length === 0) {
                throw new Error('Lagu tidak ditemukan.');
            }

            const video = searchData.data[0];
            const videoUrl = video.url;
            const videoTitle = video.title;

            // 2. GUNAKAN API DOWNLOADER KHUSUS (API ini menggunakan jalur bypass terbaru)
            // Kita coba API dari 'Widipe' atau 'Alya' yang sedang stabil-stabilnya
            const dlRes = await fetch(`https://api.alyachan.pro/api/ytmp3?url=${videoUrl}&apikey=GataDios`);
            const dlData = await dlRes.json();

            let mp3Url = null;
            if (dlData.status && dlData.data && dlData.data.url) {
                mp3Url = dlData.data.url;
            } else {
                // FALLBACK ke API cadangan lain
                const backupRes = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?url=${videoUrl}&apikey=zenkey`);
                const backupData = await backupRes.json();
                if (backupData.status && backupData.result && backupData.result.download_url) {
                    mp3Url = backupData.result.download_url;
                }
            }

            if (!mp3Url) {
                throw new Error('Server audio sedang penuh. Coba lagi dalam 1 menit.');
            }

            // 3. UNDUH DAN KIRIM KE WHATSAPP
            const media = await MessageMedia.fromUrl(mp3Url, { 
                unsafeMime: true, 
                filename: `${videoTitle}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(`🎶 *Judul:* ${videoTitle}\n\n_Sedang mengirim Voice Note..._`);

            // Kirim sebagai Voice Note
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Play Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ *Sistem Down!*\n\n*Info:* ${error.message}\n\n_Catatan: Jika terus gagal, YouTube sedang melakukan maintenance besar-besaran pada sistem API mereka. Cobalah beberapa saat lagi._`);
        }
    }
};