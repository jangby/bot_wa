const axios = require('axios');

module.exports = {
    name: 'resep',
    description: 'Cari resep makanan',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('❌ Masukkan nama masakan! Contoh: *!resep nasi goreng*');
        
        const query = args.join(' ');
        await msg.react('⏳');

        try {
            // 1. Cari resep untuk mendapatkan 'key' (ID Resep)
            const searchUrl = `https://masak-apa.tomorisakura.vercel.app/api/search/?q=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);
            
            // Validasi apakah hasil pencarian kosong
            if (!searchRes.data || !searchRes.data.status || !searchRes.data.results || searchRes.data.results.length === 0) {
                return msg.reply(`❌ Resep untuk *${query}* tidak ditemukan. Coba kata kunci lain.`);
            }

            // Ambil resep urutan pertama dari hasil pencarian
            const recipeKey = searchRes.data.results[0].key;

            // 2. Minta detail lengkap dari resep berdasarkan 'key' tersebut
            const detailUrl = `https://masak-apa.tomorisakura.vercel.app/api/recipe/${recipeKey}`;
            const detailRes = await axios.get(detailUrl);

            const data = detailRes.data.results;

            if (!data) {
                return msg.reply('❌ Detail resep tidak dapat dimuat.');
            }

            // 3. Susun dan Rapikan Pesan
            let text = `🍳 *${data.title}* 🍳\n\n`;
            text += `⏱️ *Waktu:* ${data.times || '-'}\n`;
            text += `🍽️ *Porsi:* ${data.servings || '-'}\n`;
            text += `📊 *Level:* ${data.difficulty || '-'}\n\n`;

            text += `*🛒 BAHAN-BAHAN:*\n`;
            if (data.ingredient && data.ingredient.length > 0) {
                data.ingredient.forEach(bahan => {
                    text += `• ${bahan}\n`;
                });
            } else {
                text += `• Data bahan tidak tersedia.\n`;
            }

            text += `\n*👨‍🍳 CARA MEMBUAT:*\n`;
            if (data.step && data.step.length > 0) {
                data.step.forEach((langkah) => {
                    // Format menggunakan quote block (>) agar lebih rapi di WA
                    text += `> ${langkah}\n`;
                });
            } else {
                text += `• Cara membuat tidak tersedia.\n`;
            }

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Resep:', error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal mengambil resep. Server penyedia data mungkin sedang gangguan.');
        }
    }
};