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

        // Menggunakan ID Tafsir dari database Quran.com
        // 169 = Tafsir Kemenag (Indonesia), 168 = Tafsir Ibn Kathir (English)
        const tafsirId = lang === 'id' ? '169' : '168';
        const langName = lang === 'id' ? 'Indonesia (Kemenag)' : 'English (Ibn Kathir)';

        const loadingMsg = await msg.reply(`⏳ Sedang menarik data dan menyusun dokumen Tafsir Juz ${juz}...\nKitab: *${langName}*\nMohon tunggu beberapa detik.`);
        await msg.react('⏳');

        try {
            // Memanggil API Quran.com: Satu untuk teks Arab, satu untuk teks Tafsir
            const [arabicRes, tafsirRes] = await Promise.all([
                fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?juz_number=${juz}`),
                fetch(`https://api.quran.com/api/v4/quran/tafsirs/${tafsirId}?juz_number=${juz}`)
            ]);

            const arabicJson = await arabicRes.json();
            const tafsirJson = await tafsirRes.json();

            // Cek jika API gagal merespons
            if (!arabicJson.verses || !tafsirJson.tafsirs) {
                return loadingMsg.edit('❌ Gagal mengambil data tafsir dari server Quran.com.').catch(()=>{});
            }

            const ayahsArabic = arabicJson.verses;
            const ayahsTafsir = tafsirJson.tafsirs;

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
            for (let i = 0; i < ayahsArabic.length; i++) {
                const arab = ayahsArabic[i];
                
                // Pencocokan data secara aman menggunakan "verse_key" (Format: "NomorSurah:NomorAyat", contoh "78:1")
                const tafsirData = ayahsTafsir.find(t => t.verse_key === arab.verse_key);
                
                // Menghilangkan tag HTML (<br>, <b>, dsb) bawaan dari API Quran.com agar rapi di Word
                let tafsirText = "Tafsir tidak tersedia untuk ayat ini.";
                if (tafsirData && tafsirData.text) {
                    tafsirText = tafsirData.text
                        .replace(/<[^>]+>/g, '\n')     // Ubah tag HTML menjadi enter/baris baru
                        .replace(/\n\s*\n/g, '\n\n')   // Rapikan enter yang terlalu banyak berurutan
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

                // Terjemahan Tafsir (Justify)
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

            // 4. Proses render ke file lokal
            const fileName = `Tafsir_Juz_${juz}_${lang.toUpperCase()}_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // 5. Kirim file DOCX ke WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Dokumen Tafsir Selesai!*\n\nBerikut adalah **Tafsir Juz ${juz}** lengkap.\nBerisi total ${ayahsArabic.length} ayat berserta penjabaran tafsirnya.\n\nSumber: _Quran.com API_`
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