const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

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

                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.fillText(currentText, width / 2, height / 2);

                encoder.addFrame(ctx);
            }

            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            // 1. Simpan GIF ke file sementara yang unik (pakai Date.now agar tidak bentrok)
            const time = Date.now();
            const tempGifPath = `./temp_stiker_${time}.gif`;
            const tempMp4Path = `./temp_stiker_${time}.mp4`;
            
            fs.writeFileSync(tempGifPath, buffer);

            // 2. Konversi GIF ke MP4 Asli menggunakan FFMPEG
            ffmpeg(tempGifPath)
                .outputOptions([
                    '-pix_fmt yuv420p',
                    '-c:v libx264',
                    '-movflags +faststart',
                    '-filter:v crop=trunc(iw/2)*2:trunc(ih/2)*2' // Wajib untuk MP4 (dimensi harus genap)
                ])
                .save(tempMp4Path)
                .on('end', async () => {
                    try {
                        // 3. Setelah sukses jadi MP4, baca file tersebut dan jadikan stiker
                        const media = MessageMedia.fromFilePath(tempMp4Path);
                        
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
                        // 4. Hapus file sementara untuk menghemat ruang server
                        if (fs.existsSync(tempGifPath)) fs.unlinkSync(tempGifPath);
                        if (fs.existsSync(tempMp4Path)) fs.unlinkSync(tempMp4Path);
                    }
                })
                .on('error', (err) => {
                    console.error('Error proses convert MP4:', err);
                    msg.reply('❌ Gagal merender animasi video.');
                    // Bersihkan file sementara jika error
                    if (fs.existsSync(tempGifPath)) fs.unlinkSync(tempGifPath);
                    if (fs.existsSync(tempMp4Path)) fs.unlinkSync(tempMp4Path);
                });

        } catch (error) {
            console.error('Error Stiker Teks Utama:', error);
            msg.reply('❌ Terjadi kesalahan pada sistem bot.');
        }
    }
};