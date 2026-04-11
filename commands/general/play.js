const yts = require('yt-search');

module.exports = {
    name: 'play',
    description: 'Cari lagu di YouTube dan dapatkan linknya',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('❌ Masukkan judul lagu! Contoh: *!play sempurna andra*');

        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // Melakukan pencarian ke YouTube
            const searchResult = await yts(query);
            const videos = searchResult.videos;

            // Jika tidak ada hasil yang ditemukan
            if (!videos || videos.length === 0) {
                return msg.reply(`❌ Lagu *${query}* tidak ditemukan di YouTube. Coba kata kunci lain.`);
            }

            // Ambil hasil pencarian teratas (urutan pertama)
            const video = videos[0];

            // Susun pesan balasan
            let text = `🎵 *LAGU DITEMUKAN* 🎵\n\n`;
            text += `*Judul:* ${video.title}\n`;
            text += `*Channel:* ${video.author.name}\n`;
            text += `*Durasi:* ${video.timestamp}\n`;
            text += `*Views:* ${video.views.toLocaleString('id-ID')} tayangan\n\n`;
            text += `🎧 *Dengarkan lagunya di sini:*\n${video.url}`;

            // Kirim pesan balasan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Play YouTube:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat mencari lagu di YouTube. Silakan coba lagi.');
        }
    }
};