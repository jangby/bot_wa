const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'ai',
    description: 'Membuat gambar unik dari teks Anda (gratis!)',
    type: 'general', // Bisa dipakai di PC dan Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teks deskripsi gambar yang ingin dibuat!\nContoh: *!ai a cute cat wearing a spacesuit in Mars, highly detailed*');
        }

        const prompt = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Menggambar dari teks Anda, harap tunggu sebentar...');

        try {
            // Encode prompt agar bisa digunakan dalam URL
            const encodedPrompt = encodeURIComponent(prompt);
            
            // Konstruk URL gambar (Gunakan parameter enhance untuk hasil lebih detail)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?enhance=true`;

            // Unduh gambar dari Pollinations API
            const media = await MessageMedia.fromUrl(imageUrl);
            
            // Kirim gambar ke WhatsApp
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Hasil Gambar Selesai!*\n_Prompt: ${prompt}_`
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Image:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat mencoba menggambar.').catch(()=>{});
        }
    }
};