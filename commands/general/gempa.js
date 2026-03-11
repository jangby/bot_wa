const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'gempa',
    description: 'Info gempa bumi terkini dari BMKG',
    async execute(client, msg, args) {
        // Beri reaksi dan pesan loading
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Mengambil data gempa terkini dari server BMKG... 🌍📡');

        try {
            // 1. Tembak API Resmi Data Terbuka BMKG
            const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
            
            if (!response.ok) {
                throw new Error(`Server BMKG Down (HTTP ${response.status})`);
            }

            const data = await response.json();
            
            // 2. Ambil objek data gempa-nya
            const gempa = data.Infogempa.gempa;

            // 3. Susun teks balasan yang rapi
            const pesanGempa = `🚨 *INFO GEMPA TERKINI (BMKG)* 🚨\n\n` +
                               `📍 *Lokasi:* ${gempa.Wilayah}\n` +
                               `📅 *Waktu:* ${gempa.Tanggal} | ${gempa.Jam}\n` +
                               `💥 *Magnitudo:* ${gempa.Magnitude} SR\n` +
                               `🌊 *Kedalaman:* ${gempa.Kedalaman}\n` +
                               `📌 *Koordinat:* ${gempa.Coordinates}\n` +
                               `⚠️ *Potensi:* ${gempa.Potensi}\n` +
                               `🏘️ *Dirasakan:* ${gempa.Dirasakan || '-'}`;

            // 4. Ambil gambar peta guncangan (Shakemap)
            const imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`;
            const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });

            // 5. Kirim gambar peta beserta teks info gempanya ke grup
            await msg.reply(media, null, { caption: pesanGempa });
            
            // Hapus pesan loading dan beri centang hijau
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Gempa BMKG:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply(`❌ Gagal mengambil info gempa dari BMKG.\n*Info:* ${error.message}`);
        }
    }
};