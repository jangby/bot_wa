const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Fungsi pembantu untuk memecah teks menjadi beberapa baris agar tidak keluar jalur
function getLines(ctx, text, maxWidth) {
    if (!text) return [];
    let words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

module.exports = {
    name: 'stikerteks',
    description: 'Buat stiker teks animasi dengan auto-size font',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan teksnya!\nContoh: *!stikerteks Halo kawan-kawan semuanya apa kabar*');
        }

        try {
            await msg.react('⏳');

            const text = args.join(' ');
            const words = text.split(' ');
            
            const width = 512;
            const height = 512;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // Beri jarak (margin) 40px di setiap sisi agar teks tidak terlalu mepet layar
            const padding = 40;
            const maxWidth = width - (padding * 2);
            const maxHeight = height - (padding * 2);
            
            // ==========================================
            // 1. ALGORITMA DYNAMIC FONT SIZE (AUTO-SIZE)
            // ==========================================
            let fontSize = 120; // Mulai dari ukuran raksasa
            let lineHeight = 0;
            let fullTextLines = [];
            
            // Loop untuk mengecilkan font sampai teks muat di dalam layar
            while (fontSize > 20) {
                ctx.font = `bold ${fontSize}px Arial`;
                lineHeight = fontSize * 1.2; 
                
                // Cek apakah ada 1 kata tunggal yang kepanjangan melebihi layar
                let wordTooLong = false;
                for (let w of words) {
                    if (ctx.measureText(w).width > maxWidth) {
                        wordTooLong = true;
                        break;
                    }
                }
                
                // Jika ada kata yang kepanjangan, langsung kecilkan font 5px
                if (wordTooLong) {
                    fontSize -= 5;
                    continue;
                }
                
                // Cek apakah total tinggi baris melebihi layar
                fullTextLines = getLines(ctx, text, maxWidth);
                let totalHeight = fullTextLines.length * lineHeight;
                
                // Jika tinggi teks sudah muat di layar, hentikan pencarian font
                if (totalHeight <= maxHeight) {
                    break; 
                }
                fontSize -= 5;
            }
            
            // Kunci posisi Y (Tinggi) agar animasi teks muncul stabil di tengah kanvas
            let totalFullHeight = fullTextLines.length * lineHeight;
            let startY = (height - totalFullHeight) / 2 + (lineHeight / 2);

            // ==========================================
            // 2. PEMBUATAN FRAME DEMI FRAME
            // ==========================================
            const encoder = new GIFEncoder(width, height);
            encoder.start();
            encoder.setRepeat(0);   
            encoder.setDelay(500);  // Jeda tiap kata (500ms)
            encoder.setQuality(10); 

            // Render gambar sesuai dengan urutan bertambahnya kata
            for (let i = 1; i <= words.length; i++) {
                // Potong kata dari awal sampai urutan ke-i
                let currentSubset = words.slice(0, i).join(' ');
                
                ctx.fillStyle = '#ffffff'; // Warna Background
                ctx.fillRect(0, 0, width, height);

                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = '#000000'; // Warna Teks
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Susun teks yang sudah dipotong tadi
                let subsetLines = getLines(ctx, currentSubset, maxWidth);

                // Gambar ke layar sesuai posisi barisnya
                for (let j = 0; j < subsetLines.length; j++) {
                    ctx.fillText(subsetLines[j], width / 2, startY + (j * lineHeight));
                }

                encoder.addFrame(ctx);
            }

            // Frame terakhir dijeda 2 detik (2000ms)
            encoder.setDelay(2000); 
            encoder.addFrame(ctx);

            encoder.finish();
            const buffer = encoder.out.getData();

            const time = Date.now();
            const tempGifPath = `./temp_stiker_${time}.gif`;
            const tempWebpPath = `./temp_stiker_${time}.webp`; 
            
            fs.writeFileSync(tempGifPath, buffer);

            // ==========================================
            // 3. RENDER KE WEBP KHUSUS WHATSAPP (FIX LOOPING)
            // ==========================================
            ffmpeg(tempGifPath)
                .outputOptions([
                    '-vcodec libwebp',
                    '-vf scale=512:512',
                    '-filter:v fps=fps=15', // Kunci framerate agar loop stabil di WA
                    '-lossless 1',
                    '-loop 0',              // Paksa loop tanpa batas
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
                        // Bersihkan cache file sementara
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