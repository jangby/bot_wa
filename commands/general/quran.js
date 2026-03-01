module.exports = {
    name: 'quran',
    description: 'Cari ayat Al-Quran',
    async execute(client, msg, args) {
        if (args.length < 2) return msg.reply('❌ Format: *!quran [no_surah] [no_ayat]*\nContoh: *!quran 1 1*');

        const surah = args[0];
        const ayat = args[1];

        try {
            const response = await fetch(`https://equran.id/api/v2/surat/${surah}`);
            const json = await response.json();

            if (json.code !== 200) return msg.reply('❌ Surah tidak ditemukan.');

            const dataAyat = json.data.ayat.find(a => a.nomorAyat == ayat);
            if (!dataAyat) return msg.reply(`❌ Ayat ${ayat} tidak ditemukan di surah ini.`);

            const text = `📖 *Q.S. ${json.data.namaLatin} : ${ayat}*

${dataAyat.teksArab}

_${dataAyat.teksLatin}_

"${dataAyat.teksIndonesia}"`;

            msg.reply(text);

        } catch (error) {
            console.error(error);
            msg.reply('❌ Terjadi kesalahan saat mengambil data.');
        }
    }
};