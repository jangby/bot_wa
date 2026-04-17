const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tafsirjuz',
    description: 'Buat dokumen .docx berisi Tafsir satu Juz penuh (Multi bahasa: id/en)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 1) {
            return msg.reply('❌ Format: *!tafsirjuz [no_juz] [id/en]*\nContoh: *!tafsirjuz 30 id*\nContoh EN: *!tafsirjuz 30 en*');
        }

        const juz = parseInt(args[0]);
        if (isNaN(juz) || juz < 1 || juz > 30) {
            return msg.reply('❌ Nomor Juz harus berupa angka antara 1 sampai 30.');
        }

        let lang = 'id';
        if (args.length > 1 && (args[1].toLowerCase() === 'id' || args[1].toLowerCase() === 'en')) {
            lang = args[1].toLowerCase();
        }

        // 169 = Tafsir Kemenag (Indonesia), 168 = Tafsir Ibn Kathir (English)
        const tafsirId = lang === 'id' ? '169' : '168';
        const langName = lang === 'id' ? 'Indonesia (Kemenag)' : 'English (Ibn Kathir)';

        const loadingMsg = await msg.reply(`⏳ Sedang menarik data dari server dan menyusun dokumen Tafsir Juz ${juz}...\nKitab: *${langName}*\nMohon tunggu, proses ini butuh waktu beberapa detik karena mengambil ratusan ayat.`);
        await msg.react('⏳');

        try {
            let allVerses = [];
            let page = 1;
            let totalPages = 1;

            // Mengambil data menggunakan halaman (pagination) agar API tidak menolak request yang terlalu besar
            do {
                const url = `https://api.quran.com/api/v4/verses/by_juz/${juz}?language=${lang}&words=false&translations=${tafsirId}&fields=text_uthmani&page=${page}&per_page=50`;
                const res = await fetch(url);
                const json = await res.json();
                
                if (!json.verses) break;
                
                allVerses = allVerses.concat(json.verses);
                totalPages = json.pagination.total_pages;
                page++;
            } while (page <= totalPages);

            if (allVerses.length === 0) {
                return loadingMsg.edit('❌ Gagal mengambil data tafsir dari server Quran.com.').catch(()=>{});
            }

            // --- MULAI MENYUSUN DOKUMEN DOCX ---
            let docChildren = [];

            // 1. Judul Dokumen
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Tafsir Al-Quran - Juz ${juz}`, bold: true, size: 36 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }));

            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Kitab: Tafsir ${langName}`, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }));

            // 2. Looping menyusun Ayat Arab -> Tafsir
            for (const arab of allVerses) {
                let tafsirText = "Tafsir tidak tersedia untuk ayat ini.";
                
                // Ambil data tafsir yang menempel pada objek terjemahan dari API
                if (arab.translations && arab.translations.length > 0 && arab.translations[0].text) {
                    tafsirText = arab.translations[0].text
                        .replace(/<[^>]+>/g, '')       // Hapus sisa tag HTML seperti <p> atau <b>
                        .replace(/&quot;/g, '"')       // Bersihkan simbol quote
                        .replace(/&nbsp;/g, ' ')       // Bersihkan simbol spasi HTML
                        .replace(/\n\s*\n/g, '\n\n')   // Rapikan enter yang kelebihan
                        .trim();
                }

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
                    spacing: { before: 300, after: 100 }
                }));

                // Ayat Arab (Rata Kanan)
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: arab.text_uthmani, 
                            size: 32 // 16pt agar Arab mudah dibaca
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 150 }
                }));

                // Penjabaran Tafsir (Justify)
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: tafsirText, 
                            size: 24, // 12pt
                            font: "Times New Roman"
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 400 } // Spasi bawah lebih jauh untuk pemisah antar ayat
                }));
            }

            // 3. Buat file Document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }],
            });

            // 4. Proses render ke file lokal server
            const fileName = `Tafsir_Juz_${juz}_${lang.toUpperCase()}_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // 5. Kirim file DOCX ke WhatsApp Anda
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Dokumen Tafsir Selesai!*\n\nBerikut adalah **Tafsir Juz ${juz}** lengkap.\nBerisi total ${allVerses.length} ayat berserta penjabaran tafsirnya.\n\nSumber: _Quran.com API_`
            });

            // Bersihkan pesan loading & hapus file sementara dari RAM server
            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error buat docx tafsir juz:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat memproses data/membuat dokumen.').catch(()=>{});
        }
    }
};