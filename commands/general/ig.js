const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ig',
    description: 'Download video Instagram (Reels / Post)',
    async execute(client, msg, args) {
        // 1. Cek apakah user memasukkan link
        if (args.length === 0) {
            return msg.reply('⚠️ Mana link Instagram-nya bro?\n\n*Contoh:* !ig https://www.instagram.com/reel/xxxxxx/');
        }

        const url = args[0];

        // 2. Validasi link (Pastikan itu benar-benar link Instagram)
        if (!url.includes('instagram.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan kamu ngirim link dari aplikasi Instagram.');
        }

        // Beri reaksi dan pesan loading
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu bentar ya, video IG-nya lagi di-proses... 📥');

        try {
            // 3. Kita ganti menggunakan API dari Itzpire (Sangat stabil untuk IG)
            const apiUrl = `https://itzpire.com/download/instagram?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error('API Sedang Down');
            
            const data = await response.json();

            // Cek apakah API berhasil menemukan datanya
            if (data.status !== "success" || !data.data || !data.data.media) {
                throw new Error('Data tidak ditemukan dari API');
            }

            // 4. Ambil URL video
            // API itzpire menyimpan link videonya di dalam array data.media
            const videoUrl = data.data.media[0];

            if (!videoUrl) throw new Error('Link video kosong');

            // 5. Ubah URL video menjadi format Media WhatsApp
            const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

            // 6. Kirim video ke grup
            await msg.reply(media, null, { caption: `✅ *Berhasil Download dari Instagram!*` });
            
            // Hapus pesan loading dan beri centang
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error IG Downloader:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal mendownload video. Pastikan linknya valid, tidak ada salah ketik, dan akun IG tersebut **TIDAK DI-PRIVATE**.');
        }
    }
};