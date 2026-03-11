const axios = require('axios');

module.exports = {
    name: 'hadits',
    description: 'Cari hadits lengkap dengan Arab & Artinya',
    async execute(client, msg, args) {
        // 1. Cek Input User
        if (args.length < 2) {
            return msg.reply(`❌ *Format Salah!*
Cara pakai: *!hadits [perowi] [nomor]*

📚 *Daftar Perowi:* bukhari, muslim, nasai, abudaud, tirmidzi, ibnumajah, malik, ahmad, darimi

Contoh: *!hadits bukhari 1* atau *!hadits ibnu majah 1*`);
        }

        // Ambil nomor (elemen terakhir)
        const nomor = args.pop(); 
        
        // Gabungkan sisa kata (misal "ibnu", "majah") menjadi "ibnumajah"
        const inputPerowi = args.join('').toLowerCase();

        // 2. Mapping ke format API Gading
        const daftarPerowi = {
            'bukhari': { api: 'bukhari', tampil: 'BUKHARI' },
            'muslim': { api: 'muslim', tampil: 'MUSLIM' },
            'nasai': { api: 'nasai', tampil: "NASA'I" },
            'abudaud': { api: 'abu-daud', tampil: 'ABU DAUD' },
            'tirmidzi': { api: 'tirmidzi', tampil: 'TIRMIDZI' },
            'ibnumajah': { api: 'ibnu-majah', tampil: 'IBNU MAJAH' },
            'malik': { api: 'malik', tampil: 'MALIK' },
            'ahmad': { api: 'ahmad', tampil: 'AHMAD' },
            'darimi': { api: 'darimi', tampil: 'DARIMI' }
        };

        const perowi = daftarPerowi[inputPerowi];

        if (!perowi) {
            return msg.reply('❌ Nama perowi salah! Gunakan: *bukhari, muslim, nasai, abudaud, tirmidzi, ibnumajah, malik, ahmad,* atau *darimi*.');
        }

        try {
            await msg.react('🔍');

            // 3. Request ke API
            const response = await axios.get(`https://api.hadith.gading.dev/books/${perowi.api}/${nomor}`);
            const resData = response.data;

            // Validasi data (API Gading biasanya mengembalikan data di dalam objek 'data')
            if (!resData || resData.code !== 200 || !resData.data.contents) {
                return msg.reply(`❌ Hadits *${perowi.tampil}* nomor *${nomor}* tidak ditemukan.`);
            }

            const hadits = resData.data.contents;
            const arab = hadits.arab;
            const terjemahan = hadits.id;

            // 4. Susun Pesan
            const text = `🕌 *HADITS RIWAYAT ${perowi.tampil}* 🕌\nNomor: ${nomor}\n\n${arab}\n\n💡 *Artinya:*\n"${terjemahan}"`;

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Hadits:', error.message);
            await msg.react('❌');
            
            if (error.response && error.response.status === 404) {
                msg.reply(`❌ Hadits *${perowi.tampil}* nomor *${nomor}* tidak ditemukan.`);
            } else {
                msg.reply(`❌ Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.`);
            }
        }
    }
};