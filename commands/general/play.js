const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Memutar lagu dari Spotify/Music API (Tanpa YouTube)',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan judul lagunya!\n\n*Contoh:* !play bahagia lagi');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply(`Mencari lagu *"${query}"* di database musik... 🎵`);

        try {
            // 1. Mencari lagu & mendapatkan link download dari API Spotify/Music
            // Kita gunakan API serbaguna yang mencari ke database Spotify/Deezer
            const response = await fetch(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(query)}`);
            const resData = await response.json();

            // Cek apakah data lagu ditemukan
            if (!resData.status || !resData.data) {
                // Jika cara pertama gagal, coba alternatif pencarian musik lain
                const altRes = await fetch(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`);
                const altData = await altRes.json();
                
                if (!altData.status || !altData.data || altData.data.length === 0) {
                    throw new Error('Lagu tidak ditemukan di database musik.');
                }
                
                // Ambil hasil pertama dari pencarian alternatif
                const trackUrl = altData.data[0].url;
                
                // Coba download menggunakan link hasil pencarian tadi
                const dlRes = await fetch(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(trackUrl)}`);
                const dlData = await dlRes.json();
                
                if (!dlData.status) throw new Error('Gagal mengunduh file audio.');
                var audioUrl = dlData.data.download;
                var title = dlData.data.title;
                var artist = dlData.data.artist;
            } else {
                var audioUrl = resData.data.download;
                var title = resData.data.title;
                var artist = resData.data.artist;
            }

            // 2. Download file audio dan kirim
            const media = await MessageMedia.fromUrl(audioUrl, { 
                unsafeMime: true, 
                filename: `${title}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(`🎶 *Ditemukan:* ${title}\n👤 *Artis:* ${artist}\n\n_Mengirim dalam bentuk Voice Note..._`);

            // 3. Kirim sebagai Voice Note
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Error Play Music:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Gagal memutar lagu.\n*Info:* ${error.message}\n_Coba gunakan judul lagu dan nama artis agar lebih akurat._`);
        }
    }
};