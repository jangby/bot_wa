module.exports = {
    name: 'doksurat',
    description: 'Menampilkan panduan penggunaan fitur manajemen surat',
    async execute(client, msg, args) {
        
        let teks = `📚 *BUKU PANDUAN SISTEM MANAJEMEN SURAT* 📚\n\n`;
        teks += `Sistem ini membantu Yayasan dan Pesantren dalam mengelola, menomori, dan mengarsipkan surat secara otomatis. Berikut adalah daftar perintah yang tersedia:\n\n`;

        teks += `*--- 👥 FITUR UMUM (Untuk Semua Anggota) ---*\n\n`;
        
        teks += `🔹 *!addsurat*\nMeminta format untuk membuat nomor surat otomatis.\n\n`;
        
        teks += `🔹 *!daftarsurat [kategori]*\nMelihat rekap nomor surat. Kategori bisa diisi _yayasan_, _pesantren_, atau kosongkan untuk melihat semua.\n\n`;
        
        teks += `🔹 *!carisurat [kata kunci]*\nMencari surat spesifik berdasarkan ID, Nomor, atau Perihal.\n↳ _Contoh: !carisurat rapat wali_\n\n`;
        
        teks += `🔹 *!jenissurat*\nMelihat daftar lengkap kode klasifikasi jenis surat (SK, SU, SPm, dll).\n\n`;
        
        teks += `🔹 *!arsipsurat [ID]*\nMenyimpan file dokumen fisik ke dalam server. Gunakan perintah ini sebagai *caption* saat mengirim dokumen (PDF/Word/Gambar), atau gunakan dengan cara *reply* dokumen tersebut.\n↳ _Contoh: !arsipsurat YAY001_\n\n`;
        
        teks += `🔹 *!getsurat [ID]*\nMendownload kembali dokumen surat yang sebelumnya sudah diarsipkan di server bot.\n↳ _Contoh: !getsurat PST005_\n\n`;
        
        teks += `🔹 *!rekapsurat*\nMendownload Buku Besar yang berisi seluruh data riwayat surat dalam bentuk file (.txt).\n\n`;

        teks += `*--- ⚙️ FITUR ADMIN / OWNER ---*\n\n`;
        
        teks += `🔸 *!editsurat [ID] [Perihal Baru]*\nMengoreksi nama/perihal surat jika terjadi salah ketik tanpa perlu mengubah nomor urutnya.\n↳ _Contoh: !editsurat YAY001 Rapat Pembentukan Panitia_\n\n`;
        
        teks += `🔸 *!hapussurat [ID]*\nMenghapus data surat dari buku besar jika terjadi kesalahan fatal.\n↳ _Contoh: !hapussurat YAY002_\n\n`;
        
        teks += `🔸 *!setnomorsurat [kategori] [nomor]*\nMengatur ulang urutan nomor surat (sangat berguna untuk mereset nomor urut kembali ke angka 0 pada awal tahun ajaran baru).\n↳ _Contoh: !setnomorsurat yayasan 0_\n\n`;

        teks += `=========================================\n`;
        teks += `💡 _Simpan atau *Pin* pesan ini agar Anda tidak lupa cara menggunakan sistem surat._`;

        // Mengirimkan pesan tanpa pembatasan grup agar bisa dibaca di PC juga
        await msg.reply(teks);
    }
};