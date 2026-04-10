const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'hapusbg',
    description: 'Hapus latar belakang foto',
    type: 'general',
    async execute(client, msg, args) {
        // SILAKAN MASUKKAN API KEY ANDA DARI REMOVE.BG DI BAWAH INI
        const apiKey = 'FA9vyWVeeBDGWdMqStMqGeFc'; 

        try {
            let mediaMsg = null;

            // 1. Cek apakah pesan saat ini (yang diketik dengan !hapusbg) memiliki foto
            if (msg.hasMedia && (msg.type === 'image' || msg.type === 'document')) {
                mediaMsg = msg;
            } 
            // 2. Jika tidak, cek apakah pengguna me-reply pesan lain
            else if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                // Cek apakah pesan yang di-reply adalah foto
                if (quotedMsg.hasMedia && (quotedMsg.type === 'image' || quotedMsg.type === 'document')) {
                    mediaMsg = quotedMsg;
                }
            }

            // 3. Jika dari kedua cara di atas tidak ditemukan foto, berikan peringatan
            if (!mediaMsg) {
                return msg.reply('❌ Kirim foto dengan caption *!hapusbg* atau reply foto yang sudah ada dengan perintah *!hapusbg*');
            }

            if (apiKey === 'MASUKKAN_API_KEY_ANDA_DISINI') {
                return msg.reply('❌ API Key Remove.bg belum dikonfigurasi di dalam sistem bot.');
            }

            await msg.react('⏳');
            msg.reply('⏳ Sedang memproses gambar, harap tunggu sebentar...');

            // 4. Unduh gambar (dari pesan utama ataupun pesan reply)
            const media = await mediaMsg.downloadMedia();

            // 5. Kirim gambar ke API Remove.bg
            const response = await axios.post(
                'https://api.remove.bg/v1.0/removebg',
                {
                    image_file_b64: media.data,
                    size: 'auto'
                },
                {
                    headers: {
                        'X-Api-Key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer' 
                }
            );

            // 6. Ubah hasil response kembali menjadi Base64
            const base64Data = Buffer.from(response.data, 'binary').toString('base64');
            
            // 7. Buat objek media baru dan kirim hasilnya
            const newMedia = new MessageMedia('image/png', base64Data, 'nobg.png');

            await client.sendMessage(msg.from, newMedia, { 
                caption: '✨ Latar belakang berhasil dihapus!' 
            });
            
            await msg.react('✅');

        } catch (error) {
            console.error('Error Hapus BG:', error.response ? error.response.data : error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal menghapus latar belakang. Pastikan gambar memiliki objek utama yang jelas atau cek limit API Anda.');
        }
    }
};