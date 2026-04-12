const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'docx',
    description: 'Buat dokumen .docx rapih dari teks (Mendukung Paragraf)',
    type: 'general', // Agar bisa dipakai di PC maupun Grup
    async execute(client, msg, args) {
        
        // 1. MENGAMBIL TEKS UTUH (Mempertahankan tombol Enter)
        let textContent = '';
        
        if (msg.hasQuotedMsg) {
            // Jika me-reply teks panjang
            const quoted = await msg.getQuotedMessage();
            textContent = quoted.body;
        } else {
            // Jika diketik langsung di bawah command
            // Kita cari posisi spasi atau enter pertama setelah kata "!docx"
            const match = msg.body.match(/\s/);
            if (match) {
                // Ambil sisa teks setelah command tanpa menghilangkan struktur Enter-nya
                textContent = msg.body.substring(match.index).trim();
            }
        }

        if (!textContent) {
            return msg.reply('❌ Masukkan teks yang ingin dijadikan dokumen!\nContoh:\n*!docx*\nJudul Dokumen\n\nIni adalah isi paragraf pertama...\n\nIni adalah paragraf kedua...');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('📝 Sedang menyusun paragraf dan merapikan dokumen...');

        try {
            // 2. MEMISAHKAN PARAGRAF BERDASARKAN ENTER (\n atau \r\n)
            const lines = textContent.split(/\r?\n/);
            
            // Mengubah setiap baris menjadi paragraf formal
            const docParagraphs = lines.map(line => {
                // Jika pengguna menekan Enter 2 kali (baris kosong)
                if (line.trim() === '') {
                    return new Paragraph({ text: "", spacing: { after: 200 } });
                }

                // Jika ada isi teksnya, jadikan paragraf Justify
                return new Paragraph({
                    children: [
                        new TextRun({
                            text: line.trim(),
                            font: "Times New Roman",
                            size: 24, // 24 = 12pt dalam ukuran Word
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED, // Rata kiri-kanan
                    spacing: { after: 120 } // Jarak spasi standar antar paragraf agar tidak terlalu berdempetan
                });
            });

            // 3. MEMBUAT DOKUMEN
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docParagraphs,
                }],
            });

            // Penamaan file yang rapi
            const fileName = `Dokumen_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            // Render ke file lokal
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // 4. KIRIM KE WHATSAPP
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: '✅ *Dokumen Selesai!*\nSetiap enter telah dipisahkan menjadi paragraf yang rapi (Justify).'
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

            // Bersihkan file sementara
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error buat docx:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat menyusun dokumen. Pastikan memori server tidak penuh.').catch(()=>{});
        }
    }
};