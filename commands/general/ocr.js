const Tesseract = require('tesseract.js');

module.exports = {
    name: 'ocr',
    description: 'Mengambil/menyalin teks dari sebuah gambar',
    type: 'general', // Bisa dipakai di PC maupun Grup
    async execute(client, msg, args) {
        
        // 1. Cek apakah user mengirim gambar atau me-reply gambar
        let mediaMessage = msg;
        if (msg.hasQuotedMsg) {
            mediaMessage = await msg.getQuotedMessage();
        }

        // Validasi: Pastikan itu ada medianya dan berupa gambar (image)
        if (!mediaMessage.hasMedia || mediaMessage.type !== 'image') {
            return msg.reply('❌ Kirim foto dengan caption *!ocr* atau reply foto yang sudah ada dengan *!ocr*.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang memindai teks pada gambar, proses ini mungkin memakan waktu beberapa detik...');

        try {
            // 2. Download gambar dari WhatsApp
            const media = await mediaMessage.downloadMedia();
            
            if (!media || !media.data) {
                 await loadingMsg.delete(true).catch(()=>{});
                 return msg.reply('❌ Gagal mengunduh gambar dari obrolan.');
            }

            // Ubah format base64 dari WA menjadi Buffer agar bisa dibaca Tesseract
            const imageBuffer = Buffer.from(media.data, 'base64');

            // 3. Proses OCR menggunakan Tesseract
            // Kita gunakan parameter 'ind+eng' agar bot pintar membaca Bahasa Indonesia dan Inggris
            const { data: { text } } = await Tesseract.recognize(
                imageBuffer,
                'ind+eng', 
                { 
                    // Nonaktifkan log agar terminal Anda tidak penuh dengan progress bar
                    logger: m => {} 
                }
            );

            // Jika gambar ternyata kosong atau tidak ada teks yang jelas
            if (!text || text.trim() === '') {
                await loadingMsg.delete(true).catch(()=>{});
                await msg.react('❌');
                return msg.reply('❌ Tidak ada teks yang berhasil dideteksi dari gambar tersebut. Pastikan gambar tidak buram.');
            }

            // 4. Susun balasan dan kirim hasilnya
            let replyText = `📄 *HASIL SCAN TEKS (OCR)* 📄\n\n`;
            replyText += `${text.trim()}`;

            await msg.reply(replyText);
            
            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error OCR:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan mesin saat mencoba membaca gambar.').catch(()=>{});
        }
    }
};