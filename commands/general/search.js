const { search } = require('duck-duck-scrape');

module.exports = {
    name: 'search',
    description: 'Pencarian web cepat (Anti-Blokir)',
    type: 'general', // Bisa diakses di PC maupun Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan kata kunci pencarian!\nContoh: *!search candi borobudur*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari informasi di internet...');

        try {
            // Eksekusi pencarian menggunakan DuckDuckGo (Aman dari pemblokiran IP Server)
            const searchResults = await search(query, {
                safeSearch: 'off'
            });

            // Jika tidak menemukan apa-apa
            if (!searchResults.results || searchResults.results.length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Tidak ditemukan hasil untuk pencarian: *${query}*`);
            }

            // ==========================================
            // 📝 SUSUN TEKS BALASAN
            // ==========================================
            let text = `🌐 *HASIL PENCARIAN WEB* 🌐\n\n`;
            text += `*Topik:* ${query}\n\n`;

            // Ambil 3 Artikel/Website Teratas
            const topResults = searchResults.results.slice(0, 3);
            text += `📰 *Artikel Teratas:*\n`;
            topResults.forEach((res, index) => {
                text += `*${index + 1}. ${res.title}*\n`;
                // Membersihkan tag HTML (seperti <b> atau </b>) yang kadang terbawa dari mesin pencari
                const cleanDescription = res.description.replace(/<\/?[^>]+(>|$)/g, "");
                text += `${cleanDescription}\n`;
                text += `🔗 ${res.url}\n\n`;
            });

            // Kirim teks hasil pencarian
            await msg.reply(text);

            // Bersihkan pesan loading dan beri reaksi
            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Web Search:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat mencoba mengambil data dari internet.').catch(()=>{});
        }
    }
};