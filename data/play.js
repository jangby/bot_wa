const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Mencari dan memutar lagu dari YouTube (Voice Note)',
    async execute(client, msg, args) {
        // 1. Cek apakah user memasukkan judul lagu
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan judul lagunya bro!\n\n*Contoh:* !play bahagia lagi');
        }

        const query = args.join(' ');

        // Beri reaksi dan pesan loading
        await msg.react('⏳');
        const loadingMsg = await msg.reply(`Tunggu bentar ya, lagi nyari kaset *"${query}"*... 🎧`);

        try {
            // 2. Cari video di YouTube menggunakan API Siputzx
            const searchRes = await fetch(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`);
            const searchData = await searchRes.json();

            // Cek jika lagu tidak ditemukan
            if (!searchData.status || !searchData.data || searchData.data.length === 0) {
                throw new Error('Lagunya nggak ketemu di YouTube nih.');
            }

            // Ambil hasil pencarian teratas (urutan pertama)
            const video = searchData.data[0];
            const videoUrl = video.url;
            const videoTitle = video.title;

            // 3. Download Audio MP3-nya
            const dlRes = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`);
            const dlData = await dlRes.json();

            if (!dlData.status || !dlData.data || !dlData.data.dl) {
                throw new Error('Gagal mengambil file audio dari YouTube.');
            }

            const mp3Url = dlData.data.dl;

            // 4. Ubah URL MP3 menjadi format Media WhatsApp
            // Karena ukuran lagu lumayan besar (3-5 MB), proses ini butuh waktu beberapa detik
            const media = await MessageMedia.fromUrl(mp3Url, { unsafeMime: true, filename: `${videoTitle}.mp3` });

            // Hapus pesan loading awal
            await loadingMsg.delete(true).catch(() => {});
            
            // Beri tahu grup bahwa lagu berhasil ditemukan (karena VN tidak bisa dikasih teks/caption)
            await msg.reply(`🎶 *Memutar:* ${videoTitle}\n⏳ _Voice Note sedang dikirim..._`);

            // 5. Kirim sebagai Voice Note (VN)
            // Triknya ada di opsi sendAudioAsVoice: true
            await msg.reply(media, null, { sendAudioAsVoice: true });
            
            // Beri centang hijau
            await msg.react('✅');

        } catch (error) {
            console.error('Error Play Music:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Gagal memutar lagu.\n*Info:* ${error.message}\nCoba lagi nanti atau gunakan judul lagu yang lebih spesifik.`);
        }
    }
};