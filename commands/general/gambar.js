const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'gambar',
    description: 'Membuat gambar dari teks menggunakan AI',
    async execute(client, msg, args) {
        // 1. Cek apakah user memasukkan deskripsi gambar
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan deskripsi gambarnya!\n\n*Contoh:* !gambar kucing oren gemuk pakai kacamata hitam di luar angkasa');
        }

        const prompt = args.join(' ');

        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu sebentar ya, AI sedang melukis imajinasimu... 🎨🪄');

        try {
            // 2. Susun URL API Pollinations
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;

            // 3. PERBAIKAN: Unduh gambar secara manual dalam bentuk "ArrayBuffer"
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            
            // 4. Ubah data buffer menjadi Base64 (Format yang sangat disukai WhatsApp)
            const base64Data = Buffer.from(response.data, 'binary').toString('base64');
            
            // 5. Paksa bot mengenali data tersebut sebagai gambar JPEG
            const media = new MessageMedia('image/jpeg', base64Data, 'gambar-ai.jpg');

            // 6. Kirim gambar ke grup
            await msg.reply(media, null, { caption: `🎨 *Hasil Gambar AI*\n\n📝 *Prompt:* _${prompt}_` });
            
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Gambar:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal membuat gambar. Server AI mungkin sedang sibuk, coba lagi dalam beberapa saat.');
        }
    }
};