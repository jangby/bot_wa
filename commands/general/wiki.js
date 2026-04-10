module.exports = {
    name: 'wiki',
    description: 'Mencari informasi di Wikipedia',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Apa yang ingin kamu cari?\nContoh: *!wiki Borobudur*');

        const query = args.join(' ');
        await msg.react('📚');

        try {
            // API Wikipedia Indonesia
            const response = await fetch(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const json = await response.json();

            if (json.type === 'disambiguation') {
                return msg.reply(`⚠️ Hasil terlalu luas. Harap lebih spesifik mencari *${query}*.`);
            }
            
            if (!json.extract) {
                throw new Error('Informasi tidak ditemukan.');
            }

            let pesan = `🎓 *Wikipedia: ${json.title}* 🎓\n\n`;
            pesan += json.extract;
            pesan += `\n\n🔗 *Link:* ${json.content_urls.desktop.page}`;

            await msg.reply(pesan);
            await msg.react('✅');

        } catch (error) {
            console.error(error);
            await msg.react('❌');
            msg.reply('❌ Tidak ditemukan hasil untuk kata kunci tersebut.');
        }
    }
};