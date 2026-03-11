const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Memutar lagu dengan bantuan AI agar lebih akurat',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Judul lagunya apa? \n*Contoh:* !play bahagia lagi');
        }

        const userQuery = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('AI sedang mencari lagu yang paling pas... 🧠🎵');

        try {
            // 1. TANYA AI (Gemini) UNTUK MEMPERBAIKI JUDUL LAGU
            // Kita minta AI kasih format "Judul - Artis" saja agar pencarian akurat
            const aiResponse = await fetch(`https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(
                `Saya ingin mencari lagu dengan kata kunci "${userQuery}". Tolong berikan HANYA Judul Lagu dan Nama Penyanyinya yang paling populer. Contoh: "Sial - Mahalini". Jangan beri teks lain.`
            )}`);
            const aiData = await aiResponse.json();
            
            // Jika AI gagal respon, pakai input asli user
            const fixedTitle = (aiData.status && aiData.data) ? aiData.data.replace(/"/g, '') : userQuery;
            
            console.log(`AI menyarankan: ${fixedTitle}`);

            // 2. CARI LAGU & DOWNLOAD (Gunakan API serbaguna yang lebih stabil)
            // Kita pakai API Spotify Downloader karena lebih joss
            const dlUrl = `https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(fixedTitle)}`;
            const response = await fetch(dlUrl);
            const resData = await response.json();

            if (!resData.status || !resData.data || !resData.data.download) {
                throw new Error('Lagu tidak ditemukan di server musik.');
            }

            const { download, title, artist } = resData.data;

            // 3. PROSES PENGIRIMAN
            const media = await MessageMedia.fromUrl(download, { 
                unsafeMime: true, 
                filename: `${title}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(`✅ *AI Menemukan Lagu!*\n\n🎶 *Judul:* ${title}\n👤 *Artis:* ${artist}\n\n_Sabar ya, VN lagi dikirim..._`);

            // Kirim sebagai VN
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Error Play AI:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Waduh, DJ-nya lagi pusing.\n*Info:* ${error.message}\nCoba ketik judul yang lebih jelas ya.`);
        }
    }
};