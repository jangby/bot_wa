const { MessageMedia } = require('whatsapp-web.js');
const { ApifyClient } = require('apify-client');

// Inisialisasi Client Apify
const clientApify = new ApifyClient({
    token: 'apify_api_dewuMWM2ZgfyQ3Y8mjbvEGzrneYPqW1YDfM6', 
});

module.exports = {
    name: 'play',
    description: 'Play music menggunakan Power of Apify',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Judul lagunya apa?');

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🚀 Menjalankan Engine Apify untuk mencari lagu...');

        try {
            // 1. Jalankan Actor YouTube Scraper (Contoh: mengunduh via converter)
            // Kita gunakan Actor serbaguna untuk mendapatkan stream URL
            const input = {
                "queries": [query],
                "maxResults": 1,
                "downloadAudio": true
            };

            // Menjalankan Actor (Gunakan ID Actor yang sesuai di Apify Store, misal 'h_p_a_i/youtube-downloader')
            // Catatan: Kamu bisa cari Actor "YouTube Downloader" yang free di Apify Store
            const run = await clientApify.actor("m_s_n_b/youtube-scrapper").call(input);

            // 2. Ambil hasil dari Dataset Apify
            const { items } = await clientApify.dataset(run.defaultDatasetId).listItems();

            if (items.length === 0 || !items[0].downloadUrl) {
                throw new Error('Lagu tidak ditemukan atau link download tidak tersedia.');
            }

            const song = items[0];
            const audioUrl = song.downloadUrl;
            const title = song.title || 'Audio';

            // 3. Kirim ke WhatsApp
            const media = await MessageMedia.fromUrl(audioUrl, { 
                unsafeMime: true, 
                filename: `${title}.mp3` 
            });

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(media, null, { sendAudioAsVoice: true });
            await msg.react('✅');

        } catch (error) {
            console.error('Apify Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ *Apify Gagal!* \nInfo: ${error.message}\nPastikan Token Apify benar dan kuota Trial masih ada.`);
        }
    }
};