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
            // 3. Tembak API gratis (Kita gunakan ryzendesu.vip yang stabil untuk IG)
            // encodeURIComponent berguna agar karakter unik di link (seperti ? atau &) tidak merusak URL API
            const apiUrl = `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Cek jika API merespon error atau data kosong (misal akun di-private)
            if (!data || !data.data || data.data.length === 0) {
                throw new Error('Video tidak ditemukan atau akun di-private');
            }

            // 4. Ambil URL video
            // Karena postingan IG bisa berisi banyak slide/video, API biasanya mengirimkan Array.
            // Kita ambil elemen pertama [0] yang merupakan video utamanya.
            const videoUrl = data.data[0].url;

            // 5. Ubah URL video menjadi format Media yang dikenali WhatsApp
            const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

            // 6. Kirim video ke grup
            await msg.reply(media, null, { caption: `✅ *Berhasil Download dari Instagram!*` });
            
            // Hapus pesan loading dan beri centang hijau
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error IG Downloader:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal mendownload video. Pastikan linknya benar dan akun Instagram tersebut **TIDAK DI-PRIVATE**.');
        }
    }
};