module.exports = {
    name: 'tafsir',
    description: 'Cari tafsir Al-Quran (Tafsir Kemenag)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 2) return msg.reply('❌ Format: *!tafsir [no_surah] [no_ayat]*\nContoh: *!tafsir 1 1*');

        const surah = args[0];
        const ayat = args[1];

        try {
            // Mengambil data tafsir dari API
            const response = await fetch(`https://equran.id/api/v2/tafsir/${surah}`);
            const json = await response.json();

            // Cek apakah surah valid
            if (json.code !== 200) return msg.reply('❌ Surah tidak ditemukan.');

            // Mencari tafsir berdasarkan nomor ayat
            const dataTafsir = json.data.tafsir.find(t => t.ayat == ayat);
            if (!dataTafsir) return msg.reply(`❌ Tafsir untuk ayat ${ayat} tidak ditemukan di surah ini.`);

            const text = `📚 *Tafsir Q.S. ${json.data.namaLatin} : ${ayat}*\n\n${dataTafsir.teks}`;

            // Jika teks tafsir terlalu panjang, WhatsApp mungkin memiliki batasan limit karakter per pesan,
            // Namun untuk satu ayat biasanya masih aman dikirim dalam satu bubble chat.
            msg.reply(text);

        } catch (error) {
            console.error(error);
            msg.reply('❌ Terjadi kesalahan saat mengambil data tafsir.');
        }
    }
};