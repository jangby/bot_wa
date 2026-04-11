const { igdl } = require('btch-downloader');
const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ig',
    description: 'Download video/reels/foto dari Instagram (Multi-Server)',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan link Instagram!\nContoh: *!ig https://www.instagram.com/reel/xxx*');
        }

        // 1. BERSIHKAN LINK DARI KODE PELACAK
        // Membuang semua karakter setelah tanda '?' agar scraping lebih mulus
        let url = args[0].split('?')[0];
        
        if (!url.includes('instagram.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan itu adalah link resmi dari Instagram.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencoba mengunduh media, harap tunggu sebentar...');

        try {
            let mediaUrls = [];

            // ==========================================
            // JALUR 1: Menggunakan btch-downloader lokal
            // ==========================================
            try {
                const result = await igdl(url);
                if (result && result.length > 0) {
                    mediaUrls = result.map(item => item.url || item);
                }
            } catch (err1) {
                console.log('Jalur 1 gagal, beralih ke Jalur 2...');
            }

            // ==========================================
            // JALUR 2: API Publik Siputzx
            // ==========================================
            if (mediaUrls.length === 0) {
                try {
                    const res = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${url}`);
                    if (res.data && res.data.data) {
                        mediaUrls = res.data.data.map(item => item.url);
                    }
                } catch (err2) {
                    console.log('Jalur 2 gagal, beralih ke Jalur 3...');
                }
            }
            
            // ==========================================
            // JALUR 3: API Publik Ryzendesu
            // ==========================================
            if (mediaUrls.length === 0) {
                try {
                    const res = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${url}`);
                    if (res.data && res.data.data) {
                        if (Array.isArray(res.data.data)) {
                             mediaUrls = res.data.data.map(item => item.url);
                        } else {
                             mediaUrls = [res.data.data.url || res.data.data];
                        }
                    }
                } catch (err3) {
                    console.log('Jalur 3 gagal...');
                }
            }

            // ==========================================
            // PROSES AKHIR: Eksekusi Kirim Media
            // ==========================================
            // Bersihkan url yang rusak (undefined/null)
            mediaUrls = mediaUrls.filter(u => typeof u === 'string' && u.startsWith('http'));

            // Jika dari ketiga jalur di atas tetap gagal
            if (mediaUrls.length === 0) {
                await loadingMsg.delete(true).catch(() => {});
                return msg.reply('❌ Media gagal diunduh. Instagram mungkin sedang memblokir akses bot secara global.');
            }

            // Looping untuk mengirim media (Mendukung postingan IG slide/carousel)
            for (let i = 0; i < mediaUrls.length; i++) {
                try {
                    const media = await MessageMedia.fromUrl(mediaUrls[i], { unsafeMime: true });
                    
                    await client.sendMessage(msg.from, media, { 
                        caption: i === 0 ? '✅ *Berhasil diunduh!*' : '' 
                    });
                } catch (sendErr) {
                    console.error(`Gagal mengirim media IG ke-${i+1}:`, sendErr.message);
                }
            }

            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error IG Full:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat memproses link.').catch(() => {});
        }
    }
};