const lyricsFinder = require('lyrics-finder');

module.exports = {
    name: 'lirik',
    description: 'Cari lirik lagu',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan judul lagu! Contoh: *!lirik sempurna andra and the backbone*');
        }

        // Gabungkan semua argumen menjadi satu kata kunci pencarian
        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // Parameter pertama adalah nama artis, kedua adalah judul. 
            // Kita bisa mengosongkan parameter artis ("") dan memasukkan seluruh kata kunci ke parameter judul agar pencariannya lebih luas dan pintar.
            const lirik = await lyricsFinder("", query);

            if (!lirik) {
                return msg.reply(`❌ Lirik untuk lagu *${query}* tidak ditemukan. Coba tambahkan nama penyanyinya.`);
            }

            // Susun pesan balasan
            let text = `🎶 *LIRIK LAGU* 🎶\n\n`;
            text += `*Pencarian:* ${query}\n\n`;
            text += `_${lirik}_`; // Cetak miring agar terlihat seperti lirik

            // Kirim pesan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Lirik:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat mencari lirik lagu. Silakan coba lagi nanti.');
        }
    }
};