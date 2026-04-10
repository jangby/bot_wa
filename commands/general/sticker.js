module.exports = {
    name: 'sticker',
    description: 'Ubah gambar menjadi stiker',
    type: 'general',
    async execute(client, msg, args) {
        // Cek apakah pesan memiliki media (gambar/video)
        // Atau apakah user me-reply sebuah pesan yang ada gambarnya
        if (msg.hasMedia) {
            try {
                // Beri reaksi jam pasir agar user tahu bot sedang bekerja
                await msg.react('⏳');

                const media = await msg.downloadMedia();
                
                await client.sendMessage(msg.from, media, { 
                    sendMediaAsSticker: true, 
                    stickerName: 'Stiker Bot', // Bisa diganti sesuai selera
                    stickerAuthor: 'Grup Kita' 
                });

                // Hapus reaksi jam pasir
                await msg.react('✅');

            } catch (error) {
                console.error('Error Sticker:', error);
                msg.reply('❌ Gagal membuat stiker. Pastikan file tidak rusak atau terlalu besar.');
            }
        } else {
            msg.reply('❌ Caranya salah!\nKirim gambar dengan caption *!sticker*, atau reply gambar yang sudah ada dengan *!sticker*.');
        }
    }
};