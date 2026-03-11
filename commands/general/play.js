const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Memutar lagu dengan Multi-API Server (Paling Stabil)',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan judul lagunya!\nContoh: *!play bahagia lagi*');
        }

        const userQuery = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔎 Mencari lagu di database server terbaik...');

        try {
            // 1. TANYA AI UNTUK JUDUL YANG LEBIH AKURAT
            const aiRes = await fetch(`https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(`Cari lagu "${userQuery}". Sebutkan HANYA "Penyanyi - Judul". Contoh: "Tulus - Hati Hati di Jalan". Jangan ada teks tambahan lain!`)}`);
            const aiData = await aiRes.json();
            const queryAkurat = (aiData.status && aiData.data) ? aiData.data.trim() : userQuery;

            console.log('Mencari lagu:', queryAkurat);

            let audioUrl = null;
            let finalTitle = queryAkurat;

            // ==========================================
            // SERVER 1: API AEMT (YTDL PROXY) - SANGAT STABIL
            // ==========================================
            try {
                const res1 = await fetch(`https://api.aemt.me/youtube?url=${encodeURIComponent(queryAkurat)}`);
                const data1 = await res1.json();
                if (data1.status && data1.result && data1.result.mp3) {
                    audioUrl = data1.result.mp3;
                    finalTitle = data1.result.title || queryAkurat;
                    console.log('Berhasil menggunakan Server 1');
                }
            } catch (e) { console.log('Server 1 Gagal'); }

            // ==========================================
            // SERVER 2: API DANDY (SPOTIFY DL) - ALTERNATIF
            // ==========================================
            if (!audioUrl) {
                try {
                    const res2 = await fetch(`https://api.dandymods.xyz/api/spotifydl?url=${encodeURIComponent(queryAkurat)}`);
                    const data2 = await res2.json();
                    if (data2.status && data2.result && data2.result.download) {
                        audioUrl = data2.result.download;
                        finalTitle = data2.result.title || queryAkurat;
                        console.log('Berhasil menggunakan Server 2');
                    }
                } catch (e) { console.log('Server 2 Gagal'); }
            }

            // ==========================================
            // SERVER 3: API SIPUTZX (NEW ENDPOINT)
            // ==========================================
            if (!audioUrl) {
                try {
                    const res3 = await fetch(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(queryAkurat)}`);
                    const data3 = await res3.json();
                    if (data3.status && data3.data && data3.data.download) {
                        audioUrl = data3.data.download;
                        console.log('Berhasil menggunakan Server 3');
                    }
                } catch (e) { console.log('Server 3 Gagal'); }
            }

            if (!audioUrl) {
                throw new Error('Semua server musik sedang sibuk (Overload).');
            }

            // 2. DOWNLOAD & KIRIM
            const media = await MessageMedia.fromUrl(audioUrl, { 
                unsafeMime: true, 
                filename: `${finalTitle}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(`🎶 *Lagu Ditemukan:* ${finalTitle}\n\n_Sedang mengirim Voice Note..._`);

            // Kirim sebagai VN agar keren
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Play Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Gagal memutar lagu.\n*Pesan:* ${error.message}\n\n_Saran: Coba lagi dengan judul yang lebih lengkap atau tunggu beberapa saat._`);
        }
    }
};