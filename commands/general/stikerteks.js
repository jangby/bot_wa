const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'stikerteks',
    description: 'Buat stiker teks animasi berurutan',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teksnya!\nContoh: *!stikerteks Halo semuanya selamat pagi*');
        }

        try {
            // Beri reaksi jam pasir indikator bot sedang proses
            await msg.react('⏳');

            const text = args.join(' ');
            const words = text.split(' ');
            
            // Ukuran ideal untuk stiker WhatsApp adalah persegi (512x512)
            const width = 512;
            const height = 512;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Inisialisasi pembuat GIF
            const encoder = new GIFEncoder(width, height);
            encoder.start();
            encoder.setRepeat(0);   // 0 berarti animasi akan looping (berulang) terus
            encoder.setDelay(500);  // Kecepatan jeda tiap kata (500ms = setengah detik)
            encoder.setQuality(10); 

            let currentText = '';

            // Looping untuk membuat frame per kata
            for (let i = 0; i < words.length; i++) {
                currentText += (i === 0 ? '' : ' ') + words[i];

                // Warna background (Misal: Putih)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Pengaturan font dan warna teks (Misal: Hitam)
                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Tulis teks persis di tengah kanvas
                ctx.fillText(currentText, width / 2, height / 2);

                // Tambahkan sebagai 1 frame ke dalam GIF
                encoder.addFrame(ctx);
            }

            // Beri jeda lebih lama (2000ms / 2 detik) di frame terakhir agar kalimat utuh sempat terbaca
            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            // TRIK PENTING:
            // Jadikan mimetype 'video/mp4' agar whatsapp-web.js merendernya sebagai stiker animasi via ffmpeg
            const media = new MessageMedia('video/mp4', buffer.toString('base64'), 'stiker.mp4');

            // Kirim hasilnya ke user
            await client.sendMessage(msg.from, media, { 
                sendMediaAsSticker: true, 
                stickerName: 'Stiker Teks', 
                stickerAuthor: 'Bot WA' 
            });

            // Ganti reaksi menjadi centang hijau tanda berhasil
            await msg.react('✅');

        } catch (error) {
            console.error('Error Stiker Teks:', error);
            msg.reply('❌ Gagal membuat stiker teks animasi. Pastikan dependensi *gifencoder* dan aplikasi *ffmpeg* di server/komputer sudah terinstall.');
        }
    }
};