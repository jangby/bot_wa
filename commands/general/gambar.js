const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'gambar',
    description: 'Membuat gambar dari teks menggunakan AI',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan deskripsi gambarnya!\n\n*Contoh:* !gambar kucing oren gemuk pakai kacamata hitam di luar angkasa');
        }

        const prompt = args.join(' ');

        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu sebentar ya, AI sedang melukis imajinasimu... 🎨🪄');

        try {
            // 1. Susun URL API Pollinations
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;

            // 2. Gunakan 'fetch' bawaan (Lebih aman dari blokir Cloudflare)
            // Kita tambahkan header User-Agent agar disangka dari Browser sungguhan
            const response = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            // 3. Ubah hasil download menjadi format ArrayBuffer lalu ke Base64
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            
            // 4. Paksa bot mengenali data tersebut sebagai gambar JPEG
            const media = new MessageMedia('image/jpeg', base64Data, 'gambar-ai.jpg');

            // 5. Kirim gambar ke grup
            await msg.reply(media, null, { caption: `🎨 *Hasil Gambar AI*\n\n📝 *Prompt:* _${prompt}_` });
            
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Gambar:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            
            // Tampilkan pesan error aslinya agar kita tahu kalau masih gagal
            msg.reply(`❌ Gagal membuat gambar.\n*Info:* ${error.message}\nServer AI mungkin sedang sibuk, coba lagi dalam beberapa saat.`);
        }
    }
};