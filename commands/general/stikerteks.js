const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'stikerteks',
    description: 'Buat stiker teks animasi berurutan',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teksnya! Contoh: *!stikerteks Halo apa kabar*');
        }

        try {
            await msg.react('⏳'); // Indikator loading

            const text = args.join(' ');
            const words = text.split(' ');
            
            // Siapkan kanvas berukuran 512x512 (ukuran ideal stiker WA)
            const width = 512;
            const height = 512;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Inisialisasi pembuat GIF
            const encoder = new GIFEncoder(width, height);
            encoder.start();
            encoder.setRepeat(0);   // 0 untuk loop terus-menerus
            encoder.setDelay(500);  // Jeda tiap kata (500ms atau setengah detik)
            encoder.setQuality(10); 

            let currentText = '';

            // Looping untuk membuat frame demi frame
            for (let i = 0; i < words.length; i++) {
                // Tambahkan kata baru ke kalimat yang sedang dibuat
                currentText += (i === 0 ? '' : ' ') + words[i];

                // Render background
                ctx.fillStyle = '#ffffff'; // Warna background (putih)
                ctx.fillRect(0, 0, width, height);

                // Render Teks
                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#000000'; // Warna teks (hitam)
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Fitur word wrap sederhana bisa ditambahkan di sini jika kalimat panjang
                ctx.fillText(currentText, width / 2, height / 2);

                // Masukkan gambar ini sebagai 1 frame ke dalam GIF
                encoder.addFrame(ctx);
            }

            // Tambahkan frame terakhir dengan jeda lebih lama agar teks utuh terbaca
            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            // Ubah buffer hasil GIF menjadi MessageMedia
            const media = new MessageMedia('image/gif', buffer.toString('base64'), 'stiker.gif');

            // Kirim langsung sebagai stiker animasi
            await client.sendMessage(msg.from, media, { 
                sendMediaAsSticker: true, 
                stickerName: 'Teks Video', 
                stickerAuthor: 'Bot WA' 
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error Stiker Teks:', error);
            msg.reply('❌ Gagal membuat stiker teks animasi.');
        }
    }
};