const fs = require('fs');
const path = require('path');

// 🗂️ DAFTAR MAPPING KODE SURAT
const KODE_SURAT = {
    'surat keputusan': '01/SK', 'sk': '01/SK', '01/sk': '01/SK',
    'surat undangan': '02/SU', 'undangan': '02/SU', 'su': '02/SU', '02/su': '02/SU',
    'surat permohonan': '03/SPm', 'permohonan': '03/SPm', 'spm': '03/SPm', '03/spm': '03/SPm',
    'surat pemberitahuan': '04/SPb', 'pemberitahuan': '04/SPb', 'spb': '04/SPb', '04/spb': '04/SPb',
    'surat peminjaman': '05/SPp', 'peminjaman': '05/SPp', 'spp': '05/SPp', '05/spp': '05/SPp',
    'surat pernyataan': '06/SPn', 'pernyataan': '06/SPn', 'spn': '06/SPn', '06/spn': '06/SPn',
    'surat mandat': '07/SM', 'mandat': '07/SM', 'sm': '07/SM', '07/sm': '07/SM',
    'surat tugas': '08/ST', 'tugas': '08/ST', 'st': '08/ST', '08/st': '08/ST',
    'surat keterangan': '09/SKet', 'keterangan': '09/SKet', 'sket': '09/SKet', '09/sket': '09/SKet',
    'surat rekomendasi': '10/SR', 'rekomendasi': '10/SR', 'sr': '10/SR', '10/sr': '10/SR',
    'surat balasan': '11/SB', 'balasan': '11/SB', 'sb': '11/SB', '11/sb': '11/SB',
    'surat perintah perjalanan dinas': '12/SPPD', 'sppd': '12/SPPD', 'perjalanan dinas': '12/SPPD', '12/sppd': '12/SPPD',
    'sertifikat': '13/SRT', 'srt': '13/SRT', '13/srt': '13/SRT',
    'perjanjian kerja': '14/PK', 'pk': '14/PK', '14/pk': '14/PK',
    'surat pengantar': '15/SPeng', 'pengantar': '15/SPeng', 'speng': '15/SPeng', '15/speng': '15/SPeng'
};

module.exports = {
    name: 'addsurat',
    description: 'Membuat nomor surat otomatis untuk grup (dengan pesan terpisah)',
    async execute(client, msg, args) {
        // Kunci khusus Grup
        if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        
        // Buat file JSON otomatis jika belum ada
        if (!fs.existsSync(dbPath)) {
            const initialData = { yayasan: { last_number: 0, list: [] }, pesantren: { last_number: 0, list: [] } };
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
        }
        const db = JSON.parse(fs.readFileSync(dbPath));

        // JIKA HANYA MENGETIK !addsurat
        if (args.length === 0) {
            const pesanInstruksi = `*FORMAT PEMBUATAN NOMOR SURAT*\n\nSilakan copy pesan template yang ada di bawah ini, isi data yang kosong, lalu kirimkan kembali ke grup.\n\n_Catatan: Anda cukup mengetik singkatan (SK, SU) atau namanya (Undangan), sistem akan otomatis mengonversi ke kode resmi (02/SU)._`;
            
            const pesanFormat = `!addsurat\nAsal Surat: [Yayasan / Pesantren]\nJenis Surat: [Contoh: Undangan / SK / SPb]\nNama Surat: [Contoh: Rapat Wali Santri]`;
            
            // Mengirim 2 pesan secara berurutan
            await msg.reply(pesanInstruksi);
            return client.sendMessage(msg.from, pesanFormat);
        }

        // JIKA MENGIRIM KEMBALI FORMAT YANG SUDAH DIISI
        const text = msg.body;
        
        // Ekstrak data menggunakan Regex
        const asalMatch = text.match(/Asal Surat:\s*(.+)/i);
        const jenisMatch = text.match(/Jenis Surat:\s*(.+)/i);
        const namaMatch = text.match(/Nama Surat:\s*(.+)/i);

        if (!asalMatch || !jenisMatch || !namaMatch) {
            return msg.reply('⚠️ Format tidak valid! Pastikan Anda tidak mengubah tulisan "Asal Surat:", "Jenis Surat:", dan "Nama Surat:".');
        }

        let asal = asalMatch[1].replace(/\[|\]/g, '').trim().toLowerCase();
        let jenis = jenisMatch[1].replace(/\[|\]/g, '').trim().toLowerCase();
        let nama = namaMatch[1].replace(/\[|\]/g, '').trim();

        if (asal !== 'yayasan' && asal !== 'pesantren') {
            return msg.reply('⚠️ *Asal Surat* harus diisi persis dengan kata *Yayasan* atau *Pesantren*.');
        }

        // 🛡️ VALIDASI DAN KONVERSI KODE SURAT
        let kodeJenisSurat = KODE_SURAT[jenis];
        
        // Jika kode tidak ada di daftar
        if (!kodeJenisSurat) {
            let errorMsg = `⚠️ *Jenis Surat "${jenis}" tidak dikenali!*\nSilakan isi bagian Jenis Surat dengan salah satu kode/nama berikut:\n\n`;
            errorMsg += `🔹 SK (Surat Keputusan)\n🔹 SU (Surat Undangan)\n🔹 SPm (Surat Permohonan)\n🔹 SPb (Surat Pemberitahuan)\n🔹 SPp (Surat Peminjaman)\n🔹 SPn (Surat Pernyataan)\n🔹 SM (Surat Mandat)\n🔹 ST (Surat Tugas)\n🔹 SKet (Surat Keterangan)\n🔹 SR (Surat Rekomendasi)\n🔹 SB (Surat Balasan)\n🔹 SPPD (Surat Perjalanan Dinas)\n🔹 SRT (Sertifikat)\n🔹 PK (Perjanjian Kerja)\n🔹 SPeng (Surat Pengantar)`;
            return msg.reply(errorMsg);
        }

        const kodeInstansi = asal === 'yayasan' ? 'yay-ass' : 'pst-ass';
        const kategori = asal; 

        // Tambah nomor urut otomatis
        db[kategori].last_number += 1;
        const noUrut = String(db[kategori].last_number).padStart(3, '0'); // 001, 002, dst

        // Dapatkan Bulan Romawi dan Tahun saat ini
        const now = new Date();
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const bulan = romanMonths[now.getMonth()];
        const tahun = now.getFullYear();

        // Susun Nomor Surat Final (Contoh: 001/yay-ass/02/SU/IV/2026)
        const nomorSuratFinal = `${noUrut}/${kodeInstansi}/${kodeJenisSurat}/${bulan}/${tahun}`;
        
        // Buat ID unik untuk fitur hapus (Contoh: YAY001)
        const idSurat = `${asal.toUpperCase().substring(0, 3)}${noUrut}`; 

        const newSurat = {
            id: idSurat,
            nomor_surat: nomorSuratFinal,
            nama_surat: nama,
            jenis_surat: kodeJenisSurat, // Menyimpan kode aslinya (01/SK)
            pembuat: msg.author || msg.from,
            tanggal: now.toISOString()
        };

        db[kategori].list.push(newSurat);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        const replyMsg = `✅ *NOMOR SURAT BERHASIL DIBUAT*\n\n*ID Surat:* ${idSurat}\n*Asal:* ${asal.toUpperCase()}\n*Perihal:* ${nama}\n\n*Nomor Surat Anda:*\n\`\`\`${nomorSuratFinal}\`\`\`\n\n_Catat ID Surat ( ${idSurat} ) jika sewaktu-waktu ada kesalahan dan ingin dihapus._`;
        msg.reply(replyMsg);
    }
};