module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagunya!\nContoh: *!lirik Sial Mahalini*');

        const query = args.join(' ');
        await msg.react('🔍');

        try {
            // Menggunakan API lirik yang stabil
            const response = await fetch(`https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`);
            const json = await response.json();

            if (!json.status || !json.data) {
                throw new Error('Lirik tidak ditemukan.');
            }

            const { title, artist, lyrics, image } = json.data;

            let pesan = `🎵 *Lirik Lagu ditemukan* 🎵\n\n`;
            pesan += `📌 *Judul:* ${title}\n`;
            pesan += `👤 *Penyanyi:* ${artist}\n`;
            pesan += `──────────────────\n\n`;
            pesan += lyrics;

            await msg.reply(pesan);
            await msg.react('✅');

        } catch (error) {
            console.error(error);
            await msg.react('❌');
            msg.reply('❌ Gagal mencari lirik. Coba gunakan judul yang lebih spesifik.');
        }
    }
};