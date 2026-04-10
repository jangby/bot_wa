const axios = require('axios');

module.exports = {
    name: 'cekresi',
    description: 'Cek status resi pengiriman',
    async execute(client, msg, args) {
        // Format: !cekresi [kurir] [nomor_resi]
        if (args.length < 2) {
            return msg.reply('❌ Format salah!\nContoh: *!cekresi jnt 1234567890*\nKurir: jne, jnt, sicepat, anteraja, dll.');
        }

        const kurir = args[0].toLowerCase();
        const resi = args[1];
        
        // DAFTAR DI BINDERBYTE UNTUK DAPAT API KEY GRATIS
        const apiKey = 'MASUKKAN_API_KEY_BINDERBYTE_DISINI'; 

        if (apiKey === 'MASUKKAN_API_KEY_BINDERBYTE_DISINI') {
            return msg.reply('❌ API Key Cek Resi belum diisi oleh Owner bot.');
        }

        await msg.react('⏳');

        try {
            const url = `https://api.binderbyte.com/v1/track?api_key=${apiKey}&courier=${kurir}&awb=${resi}`;
            const response = await axios.get(url);
            
            if (response.data.status !== 200) {
                return msg.reply(`❌ Resi tidak ditemukan atau belum ter-update di sistem ${kurir.toUpperCase()}.`);
            }

            const data = response.data.data;
            const history = data.history[0]; // Ambil status terbaru

            const text = `📦 *CEK RESI ${kurir.toUpperCase()}* 📦\n\n` +
                         `*No Resi:* ${data.summary.awb}\n` +
                         `*Status:* ${data.summary.status}\n` +
                         `*Penerima:* ${data.summary.receiver}\n\n` +
                         `📍 *Update Terakhir:*\n${history.date}\n_${history.desc}_`;

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Resi:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan saat mengecek resi. Coba periksa kembali nomornya.');
        }
    }
};