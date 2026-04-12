const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ai',
    description: 'Membuat gambar unik dari teks Anda (gratis!)',
    type: 'general', // Bisa dipakai di PC dan Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teks deskripsi gambar yang ingin dibuat!\nContoh: *!ai a cute cat wearing a spacesuit in Mars*');
        }

        const prompt = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🎨 Sedang menggambar dari teks Anda, proses ini butuh waktu beberapa detik...');

        try {
            const encodedPrompt = encodeURIComponent(prompt);
            
            // Konstruk URL gambar (nologo=true untuk menghilangkan watermark teks mereka)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?enhance=true&nologo=true`;

            // Unduh paksa gambar menggunakan axios dengan tipe arraybuffer
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                // Tambahkan User-Agent agar server AI mengira ini dari browser asli, bukan bot
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Ubah data mentah (buffer) menjadi format base64 yang bisa dibaca WhatsApp
            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            
            // Cetak menjadi media WhatsApp
            const media = new MessageMedia('image/jpeg', base64Image, 'gambar_ai.jpg');
            
            // Kirim gambar ke obrolan
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Hasil Gambar Selesai!*\n_Prompt: ${prompt}_`
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Image:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat mengunduh gambar dari server AI. Coba gunakan kata kunci lain.').catch(()=>{});
        }
    }
};