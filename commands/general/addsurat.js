const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addsurat',
    description: 'Membuat nomor surat otomatis untuk grup',
    async execute(client, msg, args) {
        // Kunci khusus Grup
        if (!msg.from.endsWith('@g.us')) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        
        // Buat file JSON otomatis jika belum ada
        if (!fs.existsSync(dbPath)) {
            const initialData = { yayasan: { last_number: 0, list: [] }, pesantren: { last_number: 0, list: [] } };
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
        }
        const db = JSON.parse(fs.readFileSync(dbPath));

        // JIKA HANYA MENGETIK !addsurat
        if (args.length === 0) {
            const template = `*FORMAT PEMBUATAN NOMOR SURAT*\n\nSilakan copy template di bawah ini, isi data yang di dalam kurung siku, dan kirimkan kembali ke grup.\n\n!addsurat\nAsal Surat: [Yayasan atau Pesantren]\nJenis Surat: [Contoh: Pemberitahuan / Undangan / SK]\nNama Surat: [Contoh: Rapat Wali Santri]`;
            return msg.reply(template);
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

        // Bersihkan tanda kurung siku (jika user lupa menghapus)
        let asal = asalMatch[1].replace(/\[|\]/g, '').trim().toLowerCase();
        let jenis = jenisMatch[1].replace(/\[|\]/g, '').trim();
        let nama = namaMatch[1].replace(/\[|\]/g, '').trim();

        if (asal !== 'yayasan' && asal !== 'pesantren') {
            return msg.reply('⚠️ *Asal Surat* harus diisi persis dengan kata *Yayasan* atau *Pesantren*.');
        }

        const kodeInstansi = asal === 'yayasan' ? 'yay-ass' : 'pst-ass';
        const kategori = asal; 

        // Tambah nomor urut otomatis
        db[kategori].last_number += 1;
        const noUrut = String(db[kategori].last_number).padStart(3, '0'); // Jadi 001, 002, dst

        // Dapatkan Bulan Romawi dan Tahun saat ini
        const now = new Date();
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const bulan = romanMonths[now.getMonth()];
        const tahun = now.getFullYear();

        // Susun Nomor Surat Final
        // Contoh: 001/yay-ass/Undangan/IV/2026
        const nomorSuratFinal = `${noUrut}/${kodeInstansi}/${jenis.toUpperCase()}/${bulan}/${tahun}`;
        
        // Buat ID unik untuk fitur hapus (Contoh: YAY001 atau PST001)
        const idSurat = `${asal.toUpperCase().substring(0, 3)}${noUrut}`; 

        const newSurat = {
            id: idSurat,
            nomor_surat: nomorSuratFinal,
            nama_surat: nama,
            jenis_surat: jenis,
            pembuat: msg.author || msg.from,
            tanggal: now.toISOString()
        };

        db[kategori].list.push(newSurat);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        const replyMsg = `✅ *NOMOR SURAT BERHASIL DIBUAT*\n\n*ID Surat:* ${idSurat}\n*Asal:* ${asal.toUpperCase()}\n*Perihal:* ${nama}\n\n*Nomor Surat Anda:*\n\`\`\`${nomorSuratFinal}\`\`\`\n\n_Catat ID Surat ( ${idSurat} ) jika sewaktu-waktu ada kesalahan dan ingin dihapus._`;
        msg.reply(replyMsg);
    }
};