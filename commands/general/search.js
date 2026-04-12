// Tambahkan SafeSearchType di baris paling atas
const { search, SafeSearchType } = require('duck-duck-scrape');

module.exports = {
    name: 'search',
    description: 'Pencarian web cepat (Anti-Blokir)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan kata kunci pencarian!\nContoh: *!search candi borobudur*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari informasi di internet...');

        try {
            // PERBAIKAN DI SINI: Gunakan format resmi dari library
            const searchResults = await search(query, {
                safeSearch: SafeSearchType.OFF 
            });

            if (!searchResults.results || searchResults.results.length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Tidak ditemukan hasil untuk pencarian: *${query}*`);
            }

            let text = `🌐 *HASIL PENCARIAN WEB* 🌐\n\n`;
            text += `*Topik:* ${query}\n\n`;

            const topResults = searchResults.results.slice(0, 3);
            text += `📰 *Artikel Teratas:*\n`;
            topResults.forEach((res, index) => {
                text += `*${index + 1}. ${res.title}*\n`;
                const cleanDescription = res.description.replace(/<\/?[^>]+(>|$)/g, "");
                text += `${cleanDescription}\n`;
                text += `🔗 ${res.url}\n\n`;
            });

            await msg.reply(text);

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Web Search:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem saat mencoba mengambil data dari internet.').catch(()=>{});
        }
    }
};