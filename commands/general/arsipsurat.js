const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'arsipsurat',
    description: 'Mengarsipkan file dokumen surat ke server',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');

        if (args.length === 0) {
            return msg.reply('⚠️ Harap sertakan ID Surat!\nContoh: Kirim dokumen dengan caption *!arsipsurat YAY001* atau balas dokumen dengan perintah tersebut.');
        }

        const targetId = args[0].toUpperCase();
        
        // Cek apakah ID surat ada di database
        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        let found = false;
        let targetSurat = null;

        // Cari di data Yayasan dan Pesantren
        let yayIndex = db.yayasan.list.findIndex(s => s.id === targetId);
        if (yayIndex !== -1) { found = true; targetSurat = db.yayasan.list[yayIndex]; }
        
        if (!found) {
            let pstIndex = db.pesantren.list.findIndex(s => s.id === targetId);
            if (pstIndex !== -1) { found = true; targetSurat = db.pesantren.list[pstIndex]; }
        }

        if (!found) return msg.reply(`❌ Data Surat dengan ID *${targetId}* tidak ditemukan di rekap!`);

        // 1. Deteksi apakah ada media (dokumen/foto) yang dikirim atau di-reply
        let targetMsg = msg;
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.hasMedia) targetMsg = quotedMsg;
        }

        if (!targetMsg.hasMedia) {
            return msg.reply('⚠️ Tidak ada dokumen yang terdeteksi!\n\nPastikan Anda mengirim pesan ini *bersamaan dengan dokumen* (sebagai caption), atau membalas (reply) dokumen yang sudah dikirim.');
        }

        await msg.reply('⏳ Sedang mengunduh dan mengarsipkan dokumen ke server...');

        try {
            // 2. Download media
            const media = await targetMsg.downloadMedia();
            
            // 3. Tentukan ekstensi file
            let ext = 'pdf'; 
            if (media.mimetype.includes('word')) ext = 'docx';
            else if (media.mimetype.includes('image/jpeg')) ext = 'jpg';
            else if (media.mimetype.includes('image/png')) ext = 'png';
            else if (media.filename) ext = media.filename.split('.').pop();

            // Format nama file: YAY001_168439281.pdf
            const fileName = `${targetId}_${Date.now()}.${ext}`;
            const dirPath = path.join(__dirname, '../../data/arsip_surat');
            
            // Buat folder arsip jika belum ada
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const filePath = path.join(dirPath, fileName);
            
            // 4. Simpan file ke server
            fs.writeFileSync(filePath, media.data, 'base64');

            // 5. Update database surat.json agar menyimpan nama filenya
            targetSurat.file_arsip = fileName;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

            msg.reply(`✅ *BERKAS BERHASIL DIARSIPKAN*\n\n*ID:* ${targetId}\n*Perihal:* ${targetSurat.nama_surat}\n\nBerkas fisik telah aman tersimpan di brankas server bot. 🗄️`);

        } catch (err) {
            console.error('Error saat arsip surat:', err);
            msg.reply('❌ Terjadi kesalahan saat mencoba mengunduh atau menyimpan dokumen ke server.');
        }
    }
};