const yts = require('yt-search');

module.exports = {
    name: 'resep',
    description: 'Cari video resep masakan di YouTube',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('❌ Masukkan nama masakan! Contoh: *!resep nasi goreng*');
        
        // Kita tambahkan kata "resep" di awal secara otomatis agar pencarian YouTube lebih akurat
        const masakan = args.join(' ');
        const query = `resep ${masakan}`; 
        
        await msg.react('⏳');

        try {
            // Melakukan pencarian ke YouTube
            const searchResult = await yts(query);
            const videos = searchResult.videos;

            // Jika tidak ada hasil yang ditemukan
            if (!videos || videos.length === 0) {
                return msg.reply(`❌ Video resep untuk *${masakan}* tidak ditemukan di YouTube. Coba kata kunci lain.`);
            }

            // Ambil hasil pencarian teratas (urutan pertama)
            const video = videos[0];

            // Susun pesan balasan
            let text = `🍳 *VIDEO RESEP DITEMUKAN* 🍳\n\n`;
            text += `*Judul:* ${video.title}\n`;
            text += `*Channel:* ${video.author.name}\n`;
            text += `*Durasi:* ${video.timestamp}\n`;
            text += `*Views:* ${video.views.toLocaleString('id-ID')} tayangan\n\n`;
            text += `🎬 *Tonton videonya di sini:*\n${video.url}`;

            // Kirim pesan balasan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Resep YouTube:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat mencari video di YouTube. Silakan coba lagi.');
        }
    }
};