const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'gambar',
    description: 'Membuat gambar dari teks menggunakan AI',
    async execute(client, msg, args) {
        // 1. Cek apakah user memasukkan deskripsi gambar (prompt)
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan deskripsi gambarnya!\n\n*Contoh:* !gambar kucing oren gemuk pakai kacamata hitam di luar angkasa');
        }

        // 2. Gabungkan argumen menjadi satu kalimat utuh
        const prompt = args.join(' ');

        // Beri reaksi dan pesan loading
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu sebentar ya, AI sedang melukis imajinasimu... 🎨🪄');

        try {
            // 3. Susun URL API dari Pollinations.ai
            // encodeURIComponent berguna agar spasi dan simbol diubah menjadi format link yang aman
            // Kita set resolusi 1024x1024 dan nologo=true agar bersih dari watermark
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;

            // 4. Ubah URL gambar menjadi format Media yang dikenali WhatsApp
            const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });

            // 5. Kirim gambar ke grup beserta captionnya
            await msg.reply(media, null, { caption: `🎨 *Hasil Gambar AI*\n\n📝 *Prompt:* _${prompt}_` });
            
            // Hapus pesan loading dan beri centang hijau
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Gambar:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal membuat gambar. Server AI mungkin sedang sibuk atau coba gunakan kata kunci (prompt) yang lebih sederhana.');
        }
    }
};