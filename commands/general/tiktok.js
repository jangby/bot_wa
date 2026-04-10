const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tiktok',
    description: 'Download video TikTok tanpa watermark',
    type: 'general',
    async execute(client, msg, args) {
        // 1. Cek apakah user memasukkan link
        if (args.length === 0) {
            return msg.reply('⚠️ Mana link TikTok-nya bro?\n\n*Contoh:* !tiktok https://vt.tiktok.com/xxxxxx/');
        }

        const url = args[0];

        // 2. Validasi link (Pastikan itu benar-benar link TikTok)
        if (!url.includes('tiktok.com')) {
            return msg.reply('❌ Link tidak valid! Pastikan kamu ngirim link dari aplikasi TikTok.');
        }

        // Beri reaksi dan pesan loading
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu bentar ya, videonya lagi di-download... 📥');

        try {
            // 3. Tembak API TikWM menggunakan fetch bawaan Node.js
            const response = await fetch(`https://www.tikwm.com/api/?url=${url}`);
            const data = await response.json();

            // Cek jika API merespon error (misal video dihapus atau di-private)
            if (data.code !== 0) {
                throw new Error('Video tidak ditemukan atau akun di-private');
            }

            // 4. Ambil data video dan judulnya
            const videoUrl = data.data.play; // Ini link video polos tanpa watermark
            const title = data.data.title;   // Ini caption/judul asli videonya

            // 5. Ubah URL video menjadi format Media yang dikenali WhatsApp
            const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

            // 6. Kirim video ke grup beserta captionnya
            await msg.reply(media, null, { caption: `✅ *Berhasil Download!*\n\n📝 *Judul:* ${title}` });
            
            // Hapus pesan loading dan beri centang hijau
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error TikTok Downloader:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal mendownload video. Pastikan linknya benar dan akun TikTok tersebut tidak di-private.');
        }
    }
};