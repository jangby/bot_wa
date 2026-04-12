const convertapi = require('convertapi')('IAEARotETZrZBlAGGhAp165flhYupX2U'); // Taruh API Secret Anda di sini
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'convert',
    description: 'Ubah format file (DOCX ke PDF atau PDF ke DOCX)',
    type: 'general', // Agar bisa dipakai di PC
    async execute(client, msg, args) {
        // Cek apakah user mengirim dokumen (atau me-reply dokumen)
        let mediaMessage = msg;
        if (msg.hasQuotedMsg) {
            mediaMessage = await msg.getQuotedMessage();
        }

        if (!mediaMessage.hasMedia) {
            return msg.reply('❌ Kirim dokumen dengan caption *!convert* atau reply dokumen yang sudah ada dengan *!convert*.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔄 Sedang mengunduh dan memproses dokumen, harap tunggu...');

        try {
            // 1. Download dokumen dari WhatsApp
            const media = await mediaMessage.downloadMedia();
            
            if (!media || !media.filename) {
                 await loadingMsg.delete(true).catch(()=>{});
                 return msg.reply('❌ Gagal membaca dokumen. Pastikan file dikirim sebagai "Dokumen".');
            }

            const fileName = media.filename;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const baseName = fileName.replace(`.${fileExtension}`, '');

            // Validasi format yang didukung
            if (fileExtension !== 'docx' && fileExtension !== 'pdf') {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply('❌ Bot saat ini hanya mendukung konversi dari *DOCX ke PDF* atau *PDF ke DOCX*.');
            }

            // Tentukan target format
            const targetFormat = fileExtension === 'docx' ? 'pdf' : 'docx';
            const targetFileName = `${baseName}.${targetFormat}`;
            
            // Siapkan path penyimpanan lokal sementara
            const inputPath = path.join(__dirname, '../../', fileName);
            const outputPath = path.join(__dirname, '../../', targetFileName);

            // 2. Simpan file asli ke komputer/server sementara
            fs.writeFileSync(inputPath, media.data, 'base64');

            await loadingMsg.edit(`🚀 Sedang mengubah *${fileExtension.toUpperCase()}* menjadi *${targetFormat.toUpperCase()}*...`);

            // 3. Proses Konversi menggunakan ConvertAPI
            const result = await convertapi.convert(targetFormat, {
                File: inputPath
            }, fileExtension);

            // Simpan hasil konversi dari server ConvertAPI ke lokal
            await result.saveFiles(path.join(__dirname, '../../'));

            // 4. Kirim kembali ke WhatsApp
            const convertedMedia = MessageMedia.fromFilePath(outputPath);
            await client.sendMessage(msg.from, convertedMedia, {
                caption: `✅ *Berhasil Dikonversi!*\n📄 ${targetFileName}`
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

            // 5. BERSIHKAN FILE SEMENTARA (Sangat Penting agar memori tidak penuh!)
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        } catch (error) {
            console.error('Error Convert:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Gagal melakukan konversi. Server mungkin sedang sibuk atau dokumen terkunci.').catch(()=>{});
        }
    }
};