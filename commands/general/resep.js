const axios = require('axios');

module.exports = {
    name: 'resep',
    description: 'Cari resep makanan',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('❌ Masukkan nama masakan! Contoh: *!resep nasi goreng*');
        
        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // Catatan: Ganti URL ini dengan API endpoint resep pilihan Anda (misal dari Zenziva atau penyedia API Bot WA)
            // Ini adalah contoh format pemanggilan API standar
            const apiUrl = `https://api.zahwazein.xyz/information/resep?query=${encodeURIComponent(query)}&apikey=APIKEY_GRATIS_ANDA`;
            
            /* // SIMULASI RESPONSE JIKA API AKTIF:
            const response = await axios.get(apiUrl);
            const data = response.data.result; // Sesuaikan dengan struktur JSON API Anda
            
            const text = `🍳 *RESEP: ${data.title}* 🍳\n\n` +
                         `*Bahan-bahan:*\n${data.ingredients}\n\n` +
                         `*Cara Membuat:*\n${data.steps}`;
            
            await msg.reply(text);
            */

            // Pesan sementara sebelum Anda memasukkan API Key
            msg.reply(`🥘 Fitur pencarian resep untuk *${query}* sudah siap! (Silakan masukkan API Key resep di dalam kode resep.js agar data bisa muncul)`);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Resep:', error.message);
            await msg.react('❌');
            msg.reply('❌ Resep tidak ditemukan atau terjadi kesalahan server.');
        }
    }
};