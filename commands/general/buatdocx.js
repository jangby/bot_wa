const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'docx',
    description: 'Buat dokumen .docx rapih dari teks',
    type: 'general', // Agar bisa dipakai di PC maupun Grup
    async execute(client, msg, args) {
        // Gabungkan argumen menjadi satu teks utuh, atau ambil dari pesan yang di-reply
        let textContent = args.join(' ');
        
        if (msg.hasQuotedMsg && textContent.length === 0) {
            const quoted = await msg.getQuotedMessage();
            textContent = quoted.body;
        }

        if (!textContent || textContent.trim() === '') {
            return msg.reply('❌ Masukkan teks yang ingin dijadikan dokumen!\nContoh:\n*!docx*\nJudul Dokumen\n\nIni adalah isi paragraf pertama...');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('📝 Sedang menyusun dan merapikan dokumen...');

        try {
            // Memecah teks berdasarkan enter/baris baru agar paragrafnya sesuai dengan ketikan di WA
            const lines = textContent.split('\n');
            
            // Mengubah setiap baris menjadi paragraf formal di dalam Word
            const docParagraphs = lines.map(line => {
                // Jika baris kosong, beri spasi kosong saja
                if (line.trim() === '') {
                    return new Paragraph({ text: "", spacing: { after: 200 } });
                }

                return new Paragraph({
                    children: [
                        new TextRun({
                            text: line,
                            font: "Times New Roman",
                            size: 24, // 24 = 12pt dalam ukuran Word
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED, // Rata kiri-kanan agar rapi
                    spacing: { after: 120 } // Jarak antar baris sedikit renggang agar enak dibaca
                });
            });

            // Membuat kerangka dokumen
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docParagraphs,
                }],
            });

            // Membuat nama file unik berdasarkan waktu
            const fileName = `Dokumen_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            // Proses rendering dari memori bot ke file .docx fisik
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // Kirim file ke WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: '✅ *Dokumen Selesai!*\nFormat: Times New Roman, 12pt, Justified.'
            });

            // Hapus pesan loading dan beri reaksi sukses
            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

            // Bersihkan file sementara di server agar harddisk tidak penuh
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error buat docx:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat menyusun dokumen.').catch(()=>{});
        }
    }
};