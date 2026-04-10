const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'hapusbg',
    description: 'Hapus latar belakang foto',
    async execute(client, msg, args) {
        // SILAKAN MASUKKAN API KEY ANDA DARI REMOVE.BG DI BAWAH INI
        const apiKey = 'FA9vyWVeeBDGWdMqStMqGeFc'; 

        try {
            // 1. Cek apakah ada pesan yang di-reply
            if (!msg.hasQuotedMsg) {
                return msg.reply('❌ Reply foto yang ingin dihapus latar belakangnya dengan perintah *!hapusbg*');
            }

            const quotedMsg = await msg.getQuotedMessage();

            // 2. Pastikan pesan yang di-reply adalah sebuah gambar (foto)
            if (!quotedMsg.hasMedia || quotedMsg.type !== 'image') {
                return msg.reply('❌ Pesan yang kamu reply bukan berupa foto!');
            }

            if (apiKey === 'MASUKKAN_API_KEY_ANDA_DISINI') {
                return msg.reply('❌ API Key Remove.bg belum dikonfigurasi di dalam sistem bot.');
            }

            await msg.react('⏳');
            msg.reply('⏳ Sedang memproses gambar, harap tunggu sebentar...');

            // 3. Unduh gambar yang di-reply
            const media = await quotedMsg.downloadMedia();

            // 4. Kirim gambar ke API Remove.bg menggunakan format base64
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
                    responseType: 'arraybuffer' // Penting: agar data diterima dalam format binary gambar
                }
            );

            // 5. Ubah hasil response (binary) kembali menjadi Base64
            const base64Data = Buffer.from(response.data, 'binary').toString('base64');
            
            // 6. Buat objek media baru dengan tipe PNG (karena backgroundnya transparan)
            const newMedia = new MessageMedia('image/png', base64Data, 'nobg.png');

            // 7. Kirim hasilnya
            await client.sendMessage(msg.from, newMedia, { 
                caption: '✨ Latar belakang berhasil dihapus!' 
            });
            
            await msg.react('✅');

        } catch (error) {
            console.error('Error Hapus BG:', error.response ? error.response.data : error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal menghapus latar belakang. Pastikan gambar memiliki objek utama (manusia/barang) yang jelas atau limit API bulanan kamu belum habis.');
        }
    }
};