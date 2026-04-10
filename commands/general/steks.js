const { MessageMedia } = require('whatsapp-web.js');
const { createCanvas, registerFont } = require('canvas');

module.exports = {
    name: 'steks',
    description: 'Bikin stiker teks premium',
    type: 'general',
    async execute(client, msg, args) {
        const text = args.join(' ');
        if (!text) return msg.reply('❌ Masukkan teksnya! Contoh: *!steks Halo Dunia*');

        try {
            // Beri reaksi biar user tau bot kerja
            await msg.react('🎨');

            // --- KONFIGURASI DESAIN ---
            const size = 512; // Ukuran standar stiker WA (512x512)
            const canvas = createCanvas(size, size);
            const ctx = canvas.getContext('2d');

            // 1. Background Transparan (Default)
            // Kalau mau background warna, uncomment baris bawah ini:
            // ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);

            // 2. Fungsi Auto-Wrap (Agar tidak maksa 1 baris)
            const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
                const words = text.split(' ');
                let line = '';
                let lines = [];

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                return lines;
            };

            // 3. Logika Font Size Dinamis (Makin panjang teks, makin kecil dikit)
            let fontSize = 100; // Ukuran awal (Besar)
            if (text.length > 10) fontSize = 80;
            if (text.length > 30) fontSize = 60;
            if (text.length > 60) fontSize = 40;

            // Set Font (Pastikan font mendukung emoji, biasanya Sans-Serif aman)
            // Gunakan 'Segoe UI Emoji' (Windows) atau 'Apple Color Emoji' (Mac) atau 'Noto Color Emoji' (Linux)
            // Kita pakai generic fallback agar aman di semua OS
            ctx.font = `bold ${fontSize}px sans-serif`; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 4. Hitung Posisi Tengah
            const maxWidth = size - 40; // Padding kiri kanan 20px
            const lineHeight = fontSize * 1.2;
            const lines = wrapText(ctx, text, size / 2, size / 2, maxWidth, lineHeight);
            
            // Hitung total tinggi teks agar benar-benar di tengah vertikal
            const totalHeight = lines.length * lineHeight;
            let startY = (size - totalHeight) / 2 + (lineHeight / 2);

            // 5. Gambar Teks (Stroke + Fill)
            lines.forEach((line, i) => {
                const y = startY + (i * lineHeight);
                
                // Efek Outline (Garis Tepi Hitam) - Biar terbaca di mode gelap/terang
                ctx.strokeStyle = 'black';
                ctx.lineWidth = fontSize / 8;
                ctx.lineJoin = 'round';
                ctx.strokeText(line, size / 2, y);

                // Warna Teks (Putih atau Warna-warni random)
                // Kita pakai gradasi biar mewah
                const gradient = ctx.createLinearGradient(0, 0, size, 0);
                gradient.addColorStop(0, '#FF0080'); // Pink
                gradient.addColorStop(0.5, '#FF8C00'); // Orange
                gradient.addColorStop(1, '#40E0D0'); // Tosca
                ctx.fillStyle = gradient;
                // ctx.fillStyle = 'white'; // Kalau mau putih polos, pakai ini
                
                ctx.fillText(line, size / 2, y);
            });

            // 6. Konversi ke Buffer & Kirim
            const buffer = canvas.toBuffer('image/png');
            const media = new MessageMedia('image/png', buffer.toString('base64'));

            await client.sendMessage(msg.from, media, { 
                sendMediaAsSticker: true,
                stickerName: 'Stiker Teks',
                stickerAuthor: 'Bot Keren'
            });

            await msg.react('✅');

        } catch (error) {
            console.error(error);
            await msg.react('❌');
            msg.reply('❌ Gagal membuat stiker. Pastikan library "canvas" sudah terinstall.');
        }
    }
};