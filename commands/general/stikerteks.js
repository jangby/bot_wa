const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'stikerteks',
    description: 'Buat stiker teks animasi berurutan',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teksnya! Contoh: *!stikerteks Halo semuanya selamat pagi*');
        }

        try {
            await msg.react('⏳');

            const text = args.join(' ');
            const words = text.split(' ');
            
            const width = 512;
            const height = 512;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            const encoder = new GIFEncoder(width, height);
            encoder.start();
            encoder.setRepeat(0);   
            encoder.setDelay(500);  // Jeda munculnya tiap kata (500 milidetik)
            encoder.setQuality(10); 

            let currentText = '';

            for (let i = 0; i < words.length; i++) {
                currentText += (i === 0 ? '' : ' ') + words[i];

                // Background putih
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Teks hitam
                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Tambahkan teks ke tengah kanvas
                ctx.fillText(currentText, width / 2, height / 2);

                encoder.addFrame(ctx);
            }

            // Frame terakhir dijeda 2 detik agar bisa dibaca utuh
            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            // TRICK: Gunakan video/mp4 agar whatsapp-web.js memprosesnya sebagai stiker animasi (via ffmpeg)
            const media = new MessageMedia('video/mp4', buffer.toString('base64'), 'stiker.mp4');

            await client.sendMessage(msg.from, media, { 
                sendMediaAsSticker: true, 
                stickerName: 'Teks Animasi', 
                stickerAuthor: 'Bot WA' 
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error Stiker Teks:', error);
            msg.reply('❌ Gagal membuat stiker teks animasi.');
        }
    }
};