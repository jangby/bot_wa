const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Fungsi tambahan agar teks otomatis turun ke bawah (word wrap) jika panjang
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    // Hitung posisi Y agar kumpulan teks tetap berada di tengah secara vertikal
    let startY = y - ((lines.length - 1) * lineHeight) / 2;
    for(let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x, startY + (i * lineHeight));
    }
}

module.exports = {
    name: 'stikerteks',
    description: 'Buat stiker teks animasi berurutan',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teksnya!\nContoh: *!stikerteks Halo semuanya selamat pagi*');
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
            encoder.setDelay(500);  
            encoder.setQuality(10); 

            let currentText = '';

            for (let i = 0; i < words.length; i++) {
                currentText += (i === 0 ? '' : ' ') + words[i];

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Ukuran font diperbesar menjadi 70px
                ctx.font = 'bold 70px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Gunakan fungsi wrapText, beri margin 40px di kiri & kanan (maksimal lebar 430px)
                wrapText(ctx, currentText, width / 2, height / 2, 430, 80);

                encoder.addFrame(ctx);
            }

            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            const time = Date.now();
            const tempGifPath = `./temp_stiker_${time}.gif`;
            
            // KUNCI PERUBAHAN: Ubah output menjadi WebP (Format asli stiker WA)
            const tempWebpPath = `./temp_stiker_${time}.webp`; 
            
            fs.writeFileSync(tempGifPath, buffer);

            // Konversi GIF langsung ke WebP dengan parameter loop
            ffmpeg(tempGifPath)
                .outputOptions([
                    '-vcodec libwebp',
                    '-loop 0',          // Parameter ini memaksa stiker berulang (loop) terus menerus
                    '-preset default',
                    '-an',
                    '-vsync 0'
                ])
                .save(tempWebpPath)
                .on('end', async () => {
                    try {
                        const media = MessageMedia.fromFilePath(tempWebpPath);
                        
                        await client.sendMessage(msg.from, media, { 
                            sendMediaAsSticker: true, 
                            stickerName: 'Teks Animasi', 
                            stickerAuthor: 'Bot WA' 
                        });

                        await msg.react('✅');
                    } catch (sendErr) {
                        console.error('Error saat kirim:', sendErr);
                        msg.reply('❌ Gagal mengirim hasil stiker teks.');
                    } finally {
                        if (fs.existsSync(tempGifPath)) fs.unlinkSync(tempGifPath);
                        if (fs.existsSync(tempWebpPath)) fs.unlinkSync(tempWebpPath);
                    }
                })
                .on('error', (err) => {
                    console.error('Error proses convert WEBP:', err);
                    msg.reply('❌ Gagal merender animasi video.');
                    if (fs.existsSync(tempGifPath)) fs.unlinkSync(tempGifPath);
                    if (fs.existsSync(tempWebpPath)) fs.unlinkSync(tempWebpPath);
                });

        } catch (error) {
            console.error('Error Stiker Teks Utama:', error);
            msg.reply('❌ Terjadi kesalahan pada sistem bot.');
        }
    }
};