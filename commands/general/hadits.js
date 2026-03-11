const axios = require('axios');

module.exports = {
    name: 'hadits',
    description: 'Cari hadits lengkap dengan Arab & Artinya',
    async execute(client, msg, args) {
        // 1. Cek Input User
        if (args.length < 2) {
            return msg.reply(`❌ *Format Salah!*
Cara pakai: *!hadits [perowi] [nomor]*

📚 *Daftar Perowi Tersedia:*
- bukhari
- muslim
- nasai
- abu daud
- tirmidzi
- ibnu majah
- malik
- ahmad

Contoh: *!hadits bukhari 1* atau *!hadits ibnu majah 1*`);
        }

        // PERBAIKAN: Ambil kata paling terakhir sebagai nomor
        const nomor = args.pop(); 
        
        // PERBAIKAN: Gabungkan sisa kata di depannya, lalu hapus spasinya (ibnu majah -> ibnumajah)
        const perowi = args.join('').toLowerCase();

        // 2. Validasi Nama Perowi
        const validPerowi = ['bukhari', 'muslim', 'nasai', 'abudaud', 'tirmidzi', 'ibnumajah', 'malik', 'ahmad', 'darimi'];
        if (!validPerowi.includes(perowi)) {
            return msg.reply('❌ Nama perowi salah! Cek daftar dengan ketik *!hadits* saja.');
        }

        try {
            await msg.react('🔍'); // Reaksi loading

            // 3. Ambil Data dari API
            // API by gading.dev (Gratis & Lengkap)
            const response = await axios.get(`https://api.hadith.gading.dev/books/${perowi}/${nomor}`);
            const data = response.data;

            // Cek jika data kosong / error dari API
            if (!data.data || !data.data.contents) {
                return msg.reply(`❌ Maaf, Hadits riwayat *${perowi}* nomor *${nomor}* tidak ditemukan.`);
            }

            const hadits = data.data.contents;
            const arab = hadits.arab;
            const terjemahan = hadits.id;

            // Tambahan: Merapikan nama perowi untuk ditampilkan (agar tidak tersambung)
            let namaTampil = perowi.toUpperCase();
            if (perowi === 'abudaud') namaTampil = 'ABU DAUD';
            if (perowi === 'ibnumajah') namaTampil = 'IBNU MAJAH';

            // 4. Susun Pesan (Arab di atas, Terjemahan di bawah)
            const text = `🕌 *HADITS RIWAYAT ${namaTampil}* 🕌
Nomor: ${nomor}

${arab}

💡 *Artinya:*
"${terjemahan}"`;

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Hadits:', error);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan. Pastikan nomor hadits valid (tidak melebihi jumlah hadits yang ada).');
        }
    }
};