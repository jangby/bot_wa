const { igdl } = require('btch-downloader');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ig',
    description: 'Download video/reels/foto dari Instagram',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan link Instagram!\nContoh: *!ig https://www.instagram.com/reel/xxx*');
        }

        const url = args[0];
        
        // Validasi dasar apakah itu benar-benar link IG
        if (!url.includes('instagram.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan itu adalah link dari Instagram.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mengambil media dari Instagram, harap tunggu sebentar...');

        try {
            // Melakukan proses scraping langsung menggunakan library
            const result = await igdl(url);
            
            if (!result) {
                 await loadingMsg.delete(true).catch(() => {});
                 return msg.reply('❌ Gagal memproses link. Pastikan akun target tidak di-Private.');
            }

            // Normalisasi data (Karena IG bisa berisi lebih dari 1 foto/video alias Carousel)
            let mediaUrls = [];
            if (Array.isArray(result)) {
                // Biasanya formatnya [{ url: 'http...' }, { url: 'http...' }]
                mediaUrls = result.map(item => item.url || item); 
            } else if (result.url) {
                if (Array.isArray(result.url)) {
                    mediaUrls = result.url;
                } else {
                    mediaUrls = [result.url];
                }
            } else {
                mediaUrls = [result];
            }

            // Filter pastikan hanya mengambil yang berupa teks link asli
            mediaUrls = mediaUrls.filter(u => typeof u === 'string' && u.startsWith('http'));

            if (mediaUrls.length === 0) {
                 await loadingMsg.delete(true).catch(() => {});
                 return msg.reply('❌ Media tidak ditemukan atau gagal diunduh.');
            }

            // Looping untuk mengirim semua media yang ditemukan
            for (let i = 0; i < mediaUrls.length; i++) {
                try {
                    const mediaUrl = mediaUrls[i];
                    // Ambil media dari URL hasil scrape
                    const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
                    
                    // Kirim ke chat (Caption hanya ditambahkan di media pertama)
                    await client.sendMessage(msg.from, media, { 
                        caption: i === 0 ? '✅ *Berhasil diunduh!*' : '' 
                    });
                } catch (sendErr) {
                    console.error(`Gagal mengirim media ke-${i+1}:`, sendErr.message);
                }
            }

            // Hapus pesan loading dan beri reaksi selesai
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error IG Downloader:', error.message);
            await msg.react('❌');
            
            // Edit pesan loading jika terjadi error dari server IG
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat mencoba mengunduh. YouTube/Instagram mungkin sedang memblokir akses bot.').catch(() => {
                msg.reply('❌ Terjadi kesalahan pada server saat mencoba mengunduh.');
            });
        }
    }
};