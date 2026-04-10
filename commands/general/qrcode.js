const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'qrcode',
    description: 'Buat QR Code dari teks atau link',
    async execute(client, msg, args) {
        // Cek apakah ada teks yang dimasukkan
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teks atau link!\nContoh: *!qrcode https://google.com* atau *!qrcode Hadir Kelas*');
        }

        // Gabungkan argumen menjadi satu kalimat utuh
        const text = args.join(' ');

        try {
            await msg.react('⏳');

            // Gunakan API goqr / qrserver
            // encodeURIComponent digunakan agar karakter seperti spasi, /, ?, dsb aman dimasukkan ke URL
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;

            // Ambil gambar dari URL
            const media = await MessageMedia.fromUrl(qrUrl, { unsafeMime: true });

            // Kirim gambar
            await client.sendMessage(msg.from, media, { 
                caption: `✅ Ini QR Code kamu untuk:\n_${text}_` 
            });
            
            await msg.react('✅');

        } catch (error) {
            console.error('Error QR Code:', error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal membuat QR Code. Silakan coba lagi.');
        }
    }
};