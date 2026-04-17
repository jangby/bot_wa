const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'juzperkata',
    description: 'Buat dokumen .docx Terjemahan Per Kata satu Juz penuh (Multi bahasa: id/en)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 1) {
            return msg.reply('❌ Format: *!juzperkata [no_juz] [id/en]*\nContoh: *!juzperkata 30 id*\nContoh EN: *!juzperkata 30 en*');
        }

        const juz = parseInt(args[0]);
        if (isNaN(juz) || juz < 1 || juz > 30) {
            return msg.reply('❌ Nomor Juz harus berupa angka antara 1 sampai 30.');
        }

        // Menentukan bahasa (default: id)
        let lang = 'id';
        if (args.length > 1 && (args[1].toLowerCase() === 'id' || args[1].toLowerCase() === 'en')) {
            lang = args[1].toLowerCase();
        }

        const langName = lang === 'id' ? 'Indonesia' : 'English';

        const loadingMsg = await msg.reply(`⏳ Sedang menarik data dari server...\nMenyusun tabel Terjemahan Per Kata Juz ${juz} (${langName}).\n\n_(Proses ini memakan waktu beberapa detik karena menyusun ribuan kata ke dalam tabel Word)_`);
        await msg.react('⏳');

        try {
            let allVerses = [];
            let page = 1;
            let totalPages = 1;

            // Mengambil data per-kata (words=true) menggunakan pagination
            do {
                const url = `https://api.quran.com/api/v4/verses/by_juz/${juz}?words=true&word_translation_language=${lang}&fields=text_uthmani&page=${page}&per_page=50`;
                const res = await fetch(url);
                const json = await res.json();
                
                if (!json.verses) break;
                
                allVerses = allVerses.concat(json.verses);
                totalPages = json.pagination.total_pages;
                page++;
            } while (page <= totalPages);

            if (allVerses.length === 0) {
                return loadingMsg.edit('❌ Gagal mengambil data per-kata dari server Quran.com.').catch(()=>{});
            }

            // --- MULAI MENYUSUN DOKUMEN DOCX ---
            let docChildren = [];

            // 1. Judul Dokumen
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Terjemahan Per Kata - Juz ${juz}`, bold: true, size: 36 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }));

            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Bahasa: ${langName}`, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }));

            // 2. Looping per ayat
            for (const arab of allVerses) {
                
                // Header Penanda Ayat
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: `Surah & Ayat: ${arab.verse_key}`, 
                            bold: true, 
                            size: 24, // 12pt
                            color: "2E74B5" 
                        })
                    ],
                    spacing: { before: 400, after: 150 }
                }));

                // Ayat Utuh (Rata Kanan) sebelum per kata
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: arab.text_uthmani, 
                            size: 32 // 16pt 
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 200 }
                }));

                // 3. Menyusun Tabel Per Kata untuk ayat ini
                let tableRows = [];

                // Header Tabel
                tableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: "Teks Arab", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: [new TextRun({ text: `Arti (${langName})`, bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
                        }),
                    ],
                }));

                // Looping Kata di dalam Ayat
                if (arab.words && arab.words.length > 0) {
                    for (const word of arab.words) {
                        // Abaikan tanda akhir ayat (nomor ayat di ujung)
                        if (word.char_type_name === 'end') continue;

                        const arabicText = word.text_uthmani || '-';
                        const translationText = (word.translation && word.translation.text) ? word.translation.text : '-';

                        tableRows.push(new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: arabicText, size: 32 })], 
                                        alignment: AlignmentType.CENTER 
                                    })],
                                    verticalAlign: "center"
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: translationText, size: 24 })], 
                                        alignment: AlignmentType.CENTER 
                                    })],
                                    verticalAlign: "center"
                                }),
                            ],
                        }));
                    }
                }

                // Masukkan tabel ke dalam dokumen
                const wordTable = new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E2E2" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E2E2" },
                    }
                });

                docChildren.push(wordTable);
            }

            // 4. Buat file Document Word
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }],
            });

            // 5. Proses render ke file lokal server
            const fileName = `Juz_${juz}_PerKata_${lang.toUpperCase()}_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // 6. Kirim file DOCX ke WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Dokumen Per-Kata Selesai!*\n\nBerikut adalah tabel **Terjemahan Per Kata Juz ${juz}** (${langName}).\nTeks telah disusun rapi ke dalam format tabel agar mudah dipelajari.\n\nSumber: _Quran.com API_`
            });

            // Bersihkan pesan loading & hapus file sementara dari RAM server
            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error buat docx perkata juz:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat memproses data/membuat tabel dokumen.').catch(()=>{});
        }
    }
};