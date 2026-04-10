module.exports = {
    name: 'stofoto',
    description: 'Ubah stiker kembali menjadi foto',
    type: 'general',
    async execute(client, msg, args) {
        try {
            // 1. Cek apakah pengguna me-reply pesan lain
            if (!msg.hasQuotedMsg) {
                return msg.reply('❌ Reply stiker yang ingin diubah menjadi foto dengan perintah *!stofoto*');
            }

            const quotedMsg = await msg.getQuotedMessage();

            // 2. Cek apakah pesan yang di-reply benar-benar memiliki media (stiker)
            // Stiker di WA biasanya bertipe 'sticker' dan bermimetype 'image/webp'
            if (!quotedMsg.hasMedia || quotedMsg.type !== 'sticker') {
                return msg.reply('❌ Pesan yang kamu reply bukan stiker!');
            }

            await msg.react('⏳');

            // 3. Unduh data media dari stiker tersebut
            const media = await quotedMsg.downloadMedia();

            if (!media) {
                return msg.reply('❌ Gagal mengunduh stiker. Pastikan stiker masih bisa dilihat.');
            }

            // 4. Kirim kembali sebagai foto
            // Karena kita tidak memakai opsi { sendMediaAsSticker: true }, WA akan otomatis
            // menganggap media ini sebagai gambar biasa.
            await client.sendMessage(msg.from, media, { 
                caption: '🖼️ Ini fotonya!' 
            });
            
            await msg.react('✅');

        } catch (error) {
            console.error('Error stofoto:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat memproses stiker menjadi foto.');
        }
    }
};