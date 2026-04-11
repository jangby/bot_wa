const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ig',
    description: 'Download video/reels/foto dari Instagram via Cobalt',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan link Instagram!\nContoh: *!ig https://www.instagram.com/reel/xxx*');
        }

        const url = args[0];
        
        // Validasi dasar
        if (!url.includes('instagram.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan itu adalah link resmi dari Instagram.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mengambil media dari server pusat, harap tunggu sebentar...');

        try {
            // Memanggil API Publik Cobalt (Tanpa API Key, Sangat Stabil)
            const response = await axios.post('https://co.wuk.sh/api/json', {
                url: url
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            // Jika Cobalt merespons error (misal karena akun target di-Private)
            if (data.status === 'error') {
                await loadingMsg.delete(true).catch(() => {});
                return msg.reply('❌ Gagal mengunduh. Pastikan akun Instagram tersebut tidak di-Private/digembok.');
            }

            // Normalisasi data (Cobalt memisahkan output URL tunggal dan URL banyak/Carousel)
            let mediaUrls = [];
            
            if (data.url) {
                // Jika hanya 1 video/foto
                mediaUrls.push(data.url);
            } else if (data.picker) {
                // Jika isinya berupa slide/carousel (banyak foto/video)
                mediaUrls = data.picker.map(item => item.url);
            }

            if (mediaUrls.length === 0) {
                await loadingMsg.delete(true).catch(() => {});
                return msg.reply('❌ Media tidak ditemukan di dalam link tersebut.');
            }

            // Looping untuk mengirim semua media yang berhasil ditangkap
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
            console.error('Error IG Cobalt:', error.message);
            await msg.react('❌');
            
            await loadingMsg.edit('❌ Terjadi kesalahan sistem. Server mungkin sedang kelebihan beban atau link ditolak oleh Instagram.').catch(() => {
                msg.reply('❌ Terjadi kesalahan pada server saat mencoba mengunduh.');
            });
        }
    }
};