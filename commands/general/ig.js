const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ig',
    description: 'Download video Instagram (Sistem Multi-API)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Mana link Instagram-nya bro?\n\n*Contoh:* !ig https://www.instagram.com/reel/xxxxxx/');
        }

        // Bersihkan link dari spasi
        const url = args[0].trim();

        if (!url.includes('instagram.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan itu link dari aplikasi Instagram.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu bentar ya, lagi menembus pertahanan Instagram... 🛡️📥');

        try {
            let videoUrl = null;

            // ========================================================
            // SISTEM FALLBACK: Coba berbagai API secara berurutan
            // ========================================================

            // PERCOBAAN 1: Menggunakan API Siputzx (Sangat populer saat ini)
            try {
                const res1 = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`);
                const data1 = await res1.json();
                if (data1.status && data1.data && data1.data.length > 0) {
                    videoUrl = data1.data[0].url;
                    console.log('Sukses via API 1 (Siputzx)');
                }
            } catch (e) {
                console.log('API 1 Gagal:', e.message);
            }

            // PERCOBAAN 2: Jika API 1 gagal/down, otomatis coba API Agatz
            if (!videoUrl) {
                try {
                    const res2 = await fetch(`https://api.agatz.xyz/api/igdl?url=${encodeURIComponent(url)}`);
                    const data2 = await res2.json();
                    if (data2.status && data2.data && data2.data[0].url) {
                        videoUrl = data2.data[0].url;
                        console.log('Sukses via API 2 (Agatz)');
                    }
                } catch (e) {
                    console.log('API 2 Gagal:', e.message);
                }
            }

            // Jika kedua server API gagal mendapatkan link video
            if (!videoUrl) {
                throw new Error('Semua server penyedia layanan down atau video diblokir IG');
            }

            // ========================================================
            // PROSES PENGIRIMAN VIDEO
            // ========================================================
            
            // Ubah URL menjadi format Media WhatsApp
            const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

            // Kirim video ke grup
            await msg.reply(media, null, { caption: `✅ *Berhasil Download dari Instagram!*` });
            
            // Hapus pesan loading dan beri centang
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error IG Downloader:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            
            // Menampilkan error sebenarnya agar mudah dianalisis
            msg.reply(`❌ Gagal mendownload video.\n\n*Info Sistem:* ${error.message}\nPastikan akun IG tersebut **TIDAK DI-PRIVATE**.`);
        }
    }
};