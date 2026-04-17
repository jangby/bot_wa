const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'juzperkata',
    description: 'Buat dokumen .docx Terjemahan Per Kata (Format Horizontal Hemat Kertas)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 1) {
            return msg.reply('❌ Format: *!juzperkata [no_juz] [id/en]*\nContoh: *!juzperkata 30 id*\nContoh EN: *!juzperkata 30 en*');
        }

        const juz = parseInt(args[0]);
        if (isNaN(juz) || juz < 1 || juz > 30) {
            return msg.reply('❌ Nomor Juz harus berupa angka antara 1 sampai 30.');
        }

        let lang = 'id';
        if (args.length > 1 && (args[1].toLowerCase() === 'id' || args[1].toLowerCase() === 'en')) {
            lang = args[1].toLowerCase();
        }

        const langName = lang === 'id' ? 'Indonesia' : 'English';

        const loadingMsg = await msg.reply(`⏳ Sedang menyusun tabel Terjemahan Per Kata Juz ${juz} (${langName})...\n\n_(Menyusun format horizontal hemat kertas, mohon tunggu sebentar)_`);
        await msg.react('⏳');

        try {
            let allVerses = [];
            let page = 1;
            let totalPages = 1;

            // Mengambil data per-kata
            do {
                const url = `https://api.quran.com/api/v4/verses/by_juz/${juz}?words=true&word_translation_language=${lang}&word_fields=text_uthmani&fields=text_uthmani&page=${page}&per_page=50`;
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

            // Judul Dokumen
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Terjemahan Per Kata - Juz ${juz}`, bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }));

            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Bahasa: ${langName}`, size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }));

            // Setting jumlah kolom kata per baris (6 kolom adalah ukuran paling ideal untuk kertas A4)
            const colsPerLine = 6; 

            // Looping per ayat
            for (const arab of allVerses) {
                
                // Header Penanda Ayat
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: `Surah & Ayat: ${arab.verse_key}`, 
                            bold: true, 
                            size: 20, // 10pt agar lebih hemat tempat
                            color: "2E74B5" 
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                }));

                // Ayat Utuh (Rata Kanan)
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: arab.text_uthmani, 
                            size: 28 // 14pt
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 150 }
                }));

                // Ambil semua kata kecuali tanda akhir ayat
                const words = arab.words.filter(w => w.char_type_name !== 'end');
                
                let tableRows = [];

                // Pecah susunan kata menjadi potongan-potongan (chunks) sesuai colsPerLine
                for (let i = 0; i < words.length; i += colsPerLine) {
                    const chunk = words.slice(i, i + colsPerLine);
                    
                    // MEMBALIK URUTAN ARRAY (REVERSE)
                    // Karena bahasa Arab dibaca dari kanan, kata pertama harus diletakkan di kolom paling kanan.
                    const displayChunk = [...chunk].reverse();
                    
                    let arabicCells = [];
                    let transCells = [];

                    // Jika sisa kata kurang dari target kolom (misal sisa 2 kata di baris terakhir), 
                    // tambahkan sel kosong di kiri agar teks Arab tetap rata kanan.
                    const emptyCount = colsPerLine - displayChunk.length;
                    for(let e = 0; e < emptyCount; e++) {
                        arabicCells.push(new TableCell({ children: [], width: { size: 100 / colsPerLine, type: WidthType.PERCENTAGE } }));
                        transCells.push(new TableCell({ children: [], width: { size: 100 / colsPerLine, type: WidthType.PERCENTAGE } }));
                    }

                    // Masukkan kata ke dalam sel
                    for (const word of displayChunk) {
                        const arabicText = word.text_uthmani || '-';
                        const translationText = (word.translation && word.translation.text) ? word.translation.text : '-';

                        // Sel untuk baris Arab (Baris 1)
                        arabicCells.push(new TableCell({
                            children: [new Paragraph({ 
                                children: [new TextRun({ text: arabicText, size: 28 /* 14pt */ })], 
                                alignment: AlignmentType.CENTER 
                            })],
                            width: { size: 100 / colsPerLine, type: WidthType.PERCENTAGE },
                            verticalAlign: "center",
                            margins: { top: 100, bottom: 50, left: 50, right: 50 }
                        }));

                        // Sel untuk baris Terjemahan (Baris 2)
                        transCells.push(new TableCell({
                            children: [new Paragraph({ 
                                children: [new TextRun({ text: translationText, size: 20 /* 10pt */ })], 
                                alignment: AlignmentType.CENTER 
                            })],
                            width: { size: 100 / colsPerLine, type: WidthType.PERCENTAGE },
                            verticalAlign: "center",
                            margins: { top: 50, bottom: 100, left: 50, right: 50 }
                        }));
                    }

                    // Gabungkan baris Arab di atas, Terjemahan tepat di bawahnya
                    tableRows.push(new TableRow({ children: arabicCells }));
                    tableRows.push(new TableRow({ children: transCells }));
                }

                // Masukkan tabel susunan kata ini ke dokumen
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
                
                // Tambahkan spasi antar ayat
                docChildren.push(new Paragraph({ text: "", spacing: { after: 100 } }));
            }

            // Buat file Document Word
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }],
            });

            // Proses render ke file
            const fileName = `Juz_${juz}_PerKata_Cetak_${lang.toUpperCase()}_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // Kirim file DOCX ke WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Dokumen Hemat Kertas Selesai!*\n\nBerikut adalah tabel **Terjemahan Per Kata Juz ${juz}**.\n\nFormat telah diubah menjadi menyamping (horizontal) dengan **6 kata per baris**, sangat efisien dan cocok untuk di-print.\n_Cara baca: Kolom dibaca dari Kanan ke Kiri._`
            });

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error buat docx perkata juz:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat memproses tabel dinamis dokumen.').catch(()=>{});
        }
    }
};