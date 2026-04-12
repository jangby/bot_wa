const axios = require('axios');

module.exports = {
    name: 'search',
    description: 'Pencarian informasi ensiklopedia (Anti-Blokir)',
    type: 'general', // Bisa diakses di PC maupun Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan kata kunci pencarian!\nContoh: *!search candi borobudur*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang menyusuri ensiklopedia internet...');

        try {
            // ==========================================
            // 1. CARI JUDUL ARTIKEL TERBAIK DI WIKIPEDIA
            // ==========================================
            const searchUrl = `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
            const searchRes = await axios.get(searchUrl);

            // Jika Wikipedia tidak punya datanya
            if (!searchRes.data[1] || searchRes.data[1].length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Tidak menemukan informasi pasti tentang *${query}*.\nCoba gunakan ejaan yang lebih baku/umum.`);
            }

            const title = searchRes.data[1][0]; // Judul Artikel
            const link = searchRes.data[3][0];  // Link Artikel

            // ==========================================
            // 2. AMBIL ISI PENJELASAN (RANGKUMAN)
            // ==========================================
            const detailUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json`;
            const detailRes = await axios.get(detailUrl);
            
            const pages = detailRes.data.query.pages;
            const pageId = Object.keys(pages)[0];
            let extract = pages[pageId].extract;

            // Batasi panjang teks agar tidak kepanjangan di layar WA (Maks 1500 karakter)
            if (extract.length > 1500) {
                extract = extract.substring(0, 1500) + '...\n\n_(Penjelasan dipotong karena terlalu panjang)_';
            }

            // ==========================================
            // 3. SUSUN TEKS BALASAN
            // ==========================================
            let text = `🌐 *INFORMASI WIKIPEDIA* 🌐\n\n`;
            text += `*Topik:* ${title}\n\n`;
            text += `${extract}\n\n`;
            text += `🔗 *Baca selengkapnya:* ${link}`;

            // Kirim balasan
            await msg.reply(text);

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Wikipedia API:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat menghubungi server ensiklopedia.').catch(()=>{});
        }
    }
};