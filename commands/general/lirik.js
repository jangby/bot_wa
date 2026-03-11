module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu (Multi-Server)',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagunya!\nContoh: *!lirik Komang*');

        const query = args.join(' ');
        await msg.react('🔍');
        const loadingMsg = await msg.reply(`🔎 Mencari lirik *"${query}"*...`);

        try {
            // SERVER 1: API AlyaChan (Sangat Stabil)
            let response = await fetch(`https://api.alyachan.pro/api/lyrics?q=${encodeURIComponent(query)}&apikey=GataDios`);
            let json = await response.json();

            let data = null;

            if (json.status && json.data) {
                data = json.data;
            } else {
                // SERVER 2: API Fallback (Siputzx New Path)
                let res2 = await fetch(`https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`);
                let json2 = await res2.json();
                if (json2.status && json2.data) data = json2.data;
            }

            if (!data) {
                throw new Error('Lirik tidak ditemukan di semua server.');
            }

            // Destructuring data (menyesuaikan format API)
            const title = data.title || data.song || 'Unknown Title';
            const artist = data.artist || data.singer || 'Unknown Artist';
            const lyrics = data.lyrics || data.lirik;

            let pesan = `🎵 *Lirik Lagu Ditemukan* 🎵\n\n`;
            pesan += `📌 *Judul:* ${title}\n`;
            pesan += `👤 *Penyanyi:* ${artist}\n`;
            pesan += `──────────────────\n\n`;
            pesan += lyrics;

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(pesan);
            await msg.react('✅');

        } catch (error) {
            console.error('Lirik Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ *Gagal!* Server lirik sedang sibuk.\n\n_Tips: Coba tambahkan nama penyanyinya, contoh: !lirik komang raim laode_');
        }
    }
};