const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tafsirjuz',
    description: 'Buat dokumen .docx berisi Tafsir satu Juz penuh beserta ayatnya (Multi bahasa: id/en)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 1) {
            return msg.reply('❌ Format: *!tafsirjuz [no_juz] [id/en]*\nContoh: *!tafsirjuz 30 id*\nContoh EN: *!tafsirjuz 30 en*');
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

        // Menentukan edisi tafsir di API Alquran.cloud (Jalalayn tersedia ID dan EN)
        const tafsirEdition = lang === 'id' ? 'id.jalalayn' : 'en.jalalayn';
        const langName = lang === 'id' ? 'Indonesia' : 'English';

        const loadingMsg = await msg.reply(`⏳ Sedang menyusun dokumen Tafsir Juz ${juz} (${langName})...\nProses ini mungkin memakan waktu beberapa detik karena mengambil ratusan ayat.`);
        await msg.react('⏳');

        try {
            // Mengambil Teks Arab dan Teks Tafsir secara bersamaan menggunakan Promise.all
            const [arabicRes, tafsirRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`),
                fetch(`https://api.alquran.cloud/v1/juz/${juz}/${tafsirEdition}`)
            ]);

            const arabicJson = await arabicRes.json();
            const tafsirJson = await tafsirRes.json();

            if (arabicJson.code !== 200 || tafsirJson.code !== 200) {
                return loadingMsg.edit('❌ Gagal mengambil data dari server. Coba lagi nanti.').catch(()=>{});
            }

            const ayahsArabic = arabicJson.data.ayahs;
            const ayahsTafsir = tafsirJson.data.ayahs;

            // --- MULAI MENYUSUN DOKUMEN DOCX ---
            let docChildren = [];

            // 1. Judul Dokumen
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `Tafsir Al-Quran - Juz ${juz}`, bold: true, size: 36 })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }));

            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `Tafsir Jalalayn (Bahasa ${langName})`, size: 28 })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }));

            // 2. Looping menyusun Ayat Arab -> Tafsir
            for (let i = 0; i < ayahsArabic.length; i++) {
                const arab = ayahsArabic[i];
                const tafsir = ayahsTafsir[i];

                // Info Surah & Nomor Ayat
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: `Q.S. ${arab.surah.englishName} (${arab.surah.number}) : Ayat ${arab.numberInSurah}`, 
                            bold: true, 
                            size: 24, // 12pt
                            color: "2E74B5" // Warna biru elegan
                        })
                    ],
                    spacing: { before: 300, after: 100 }
                }));

                // Teks Arab (Rata Kanan)
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: arab.text, 
                            size: 32 // 16pt agar huruf Arab jelas
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 150 }
                }));

                // Teks Tafsir (Justify)
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ 
                            text: tafsir.text, 
                            size: 24, // 12pt
                            font: "Times New Roman"
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 }
                }));
            }

            // 3. Buat file Document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }],
            });

            // 4. Proses render ke file
            const fileName = `Tafsir_Juz_${juz}_${lang.toUpperCase()}_${Date.now()}.docx`;
            const filePath = path.join(__dirname, '../../', fileName);

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);

            // 5. Kirim file DOCX ke WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(msg.from, media, {
                caption: `✅ *Berhasil!*\n\nBerikut adalah dokumen lengkap untuk **Tafsir Juz ${juz}**.\nTerdiri dari ${ayahsArabic.length} ayat yang sudah disusun rapi (Ayat Arab beserta Tafsirnya).`
            });

            // Bersihkan pesan loading & file sementara
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