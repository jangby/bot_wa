const axios = require('axios');

module.exports = {
    name: 'lirik',
    description: 'Cari lirik lagu',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan judul lagu! Contoh: *!lirik in the stars benson boone*');
        }

        // Gabungkan argumen menjadi kata kunci
        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // Menggunakan API LRCLIB pilihan Anda
            const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
            
            const response = await axios.get(url);
            const data = response.data;

            // Karena LRCLIB mengembalikan data berupa daftar, kita cek apakah daftarnya kosong
            if (!data || data.length === 0) {
                return msg.reply(`❌ Lagu *${query}* tidak ditemukan di database. Coba judul yang lebih spesifik.`);
            }

            // Ambil hasil pencarian yang paling relevan (urutan pertama / index 0)
            const track = data[0];

            // Cek apakah lirik teks (plainLyrics) tersedia untuk lagu tersebut
            if (!track.plainLyrics) {
                return msg.reply(`❌ Lirik untuk lagu *${track.trackName}* belum tersedia di database LRCLIB.`);
            }

            // Susun pesan balasan yang rapi
            let text = `🎶 *LIRIK LAGU* 🎶\n\n`;
            text += `*Judul:* ${track.trackName}\n`;
            text += `*Artis:* ${track.artistName}\n\n`;
            text += `_${track.plainLyrics}_`; 

            // Kirim pesan ke obrolan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Lirik LRCLIB:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat menghubungi server pencarian lirik. Coba beberapa saat lagi.');
        }
    }
};