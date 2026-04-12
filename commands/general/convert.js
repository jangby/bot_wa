const convertapi = require('convertapi')('IAEARotETZrZBlAGGhAp165flhYupX2U'); 
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'convert',
    description: 'Ubah format file (DOCX ke PDF atau sebaliknya) dengan hapus otomatis',
    type: 'general', // Agar bisa dipakai di PC
    async execute(client, msg, args) {
        let mediaMessage = msg;
        if (msg.hasQuotedMsg) {
            mediaMessage = await msg.getQuotedMessage();
        }

        if (!mediaMessage.hasMedia) {
            return msg.reply('❌ Kirim dokumen dengan caption *!convert* atau reply dokumen yang sudah ada.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔄 Sedang mengunduh dan memproses dokumen, harap tunggu...');

        try {
            // 1. Download dokumen
            const media = await mediaMessage.downloadMedia();
            
            if (!media || !media.filename) {
                 await loadingMsg.delete(true).catch(()=>{});
                 return msg.reply('❌ Gagal membaca dokumen. Pastikan file dikirim sebagai "Dokumen".');
            }

            const fileName = media.filename;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const baseName = fileName.replace(`.${fileExtension}`, '');

            if (fileExtension !== 'docx' && fileExtension !== 'pdf') {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply('❌ Bot saat ini hanya mendukung konversi dari *DOCX ke PDF* atau *PDF ke DOCX*.');
            }

            const targetFormat = fileExtension === 'docx' ? 'pdf' : 'docx';
            const targetFileName = `${baseName}.${targetFormat}`;
            
            const inputPath = path.join(__dirname, '../../', fileName);
            const outputPath = path.join(__dirname, '../../', targetFileName);

            fs.writeFileSync(inputPath, media.data, 'base64');
            await loadingMsg.edit(`🚀 Sedang mengubah *${fileExtension.toUpperCase()}* menjadi *${targetFormat.toUpperCase()}*...`);

            // 2. Proses Konversi
            const result = await convertapi.convert(targetFormat, {
                File: inputPath
            }, fileExtension);

            await result.saveFiles(path.join(__dirname, '../../'));

            // 3. Kirim Hasil Konversi
            const convertedMedia = MessageMedia.fromFilePath(outputPath);
            
            // Simpan data pesan yang dikirim bot ke dalam variabel 'botMessage'
            const botMessage = await client.sendMessage(msg.from, convertedMedia, {
                caption: `✅ *Berhasil Dikonversi!*\n📄 ${targetFileName}\n\n🛡️ _Untuk keamanan data, dokumen asli dan hasil konversi ini akan dihapus otomatis oleh sistem dalam 3 menit. Segera simpan!_`
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

            // 4. Bersihkan file lokal (Harddisk)
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            // ==========================================
            // 🛡️ 5. FITUR HAPUS PESAN OTOMATIS (3 MENIT)
            // ==========================================
            const deleteDelay = 3 * 60 * 1000; // 3 Menit dalam milidetik

            setTimeout(async () => {
                try {
                    // Hapus dokumen hasil dari bot (Tarik Pesan)
                    await botMessage.delete(true);
                    
                    // Hapus dokumen asli dari user (Tarik Pesan)
                    // Catatan: Di dalam grup, bot WAJIB jadi Admin agar bisa menghapus pesan orang lain.
                    await mediaMessage.delete(true);
                    
                    // Beri notifikasi kecil bahwa file sudah diamankan
                    await client.sendMessage(msg.from, `🗑️ *Auto-Delete:* Dokumen *${baseName}* telah dihapus permanen dari obrolan demi keamanan data.`);
                } catch (delErr) {
                    console.log('Gagal menghapus pesan otomatis:', delErr.message);
                }
            }, deleteDelay);

        } catch (error) {
            console.error('Error Convert:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Gagal melakukan konversi. Server mungkin sedang sibuk atau dokumen terkunci.').catch(()=>{});
        }
    }
};