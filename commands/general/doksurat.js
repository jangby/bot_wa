module.exports = {
    name: 'doksurat',
    description: 'Menampilkan panduan penggunaan fitur manajemen surat (Update Fitur Cetak)',
    async execute(client, msg, args) {
        
        let teks = `📚 *BUKU PANDUAN SISTEM MANAJEMEN SURAT* 📚\n\n`;
        teks += `Sistem ini membantu Yayasan dan Pesantren dalam mengelola, menomori, mengarsipkan, hingga *mencetak dokumen secara otomatis*. Berikut adalah daftar perintahnya:\n\n`;

        teks += `*--- 👥 FITUR ADMINISTRASI UMUM ---*\n\n`;
        
        teks += `🔹 *!addsurat*\nMeminta format untuk membuat nomor surat otomatis.\n\n`;
        
        teks += `🔹 *!daftarsurat [kategori]*\nMelihat rekap nomor surat. Kategori bisa diisi _yayasan_, _pesantren_, atau kosongkan.\n\n`;
        
        teks += `🔹 *!carisurat [kata kunci]*\nMencari surat spesifik berdasarkan ID, Nomor, atau Perihal.\n↳ _Contoh: !carisurat rapat wali_\n\n`;
        
        teks += `🔹 *!jenissurat*\nMelihat daftar lengkap kode klasifikasi jenis surat (SK, SU, SPm, dll).\n\n`;
        
        teks += `🔹 *!arsipsurat [ID]*\nMenyimpan file dokumen fisik ke dalam server. Gunakan sebagai caption atau reply saat mengirim dokumen.\n↳ _Contoh: !arsipsurat YAY001_\n\n`;
        
        teks += `🔹 *!getsurat [ID]*\nMendownload kembali dokumen surat yang sudah diarsipkan di server bot.\n\n`;
        
        teks += `🔹 *!rekapsurat*\nMendownload Buku Besar riwayat surat (format .txt).\n\n`;

        teks += `*--- 🖨️ FITUR CETAK SURAT (AUTO-GENERATE) ---*\n\n`;
        
        teks += `🔹 *!templates*\nMelihat daftar nama template surat (Microsoft Word) yang siap dicetak dari server.\n\n`;

        teks += `🔹 *!cetaksurat [Nama Template]*\nMeminta bot untuk membaca isi file template dan memberikan format isiannya. Pengurus tinggal mengisi variabel yang diminta.\n↳ _Contoh: !cetaksurat SP1_\n\n`;
        
        teks += `_💡 Catatan: Saat dicetak, variabel {tanggal} pada dokumen Word akan otomatis diisi dengan tanggal hari ini tanpa perlu diketik manual._\n\n`;

        teks += `*--- ⚙️ FITUR ADMIN / OWNER ---*\n\n`;
        
        teks += `🔸 *!editsurat [ID] [Perihal Baru]*\nMengoreksi nama/perihal surat tanpa mengubah nomor urutnya.\n↳ _Contoh: !editsurat YAY001 Rapat Pembentukan Panitia_\n\n`;
        
        teks += `🔸 *!hapussurat [ID]*\nMenghapus data surat dari buku besar.\n↳ _Contoh: !hapussurat YAY002_\n\n`;
        
        teks += `🔸 *!setnomorsurat [kategori] [nomor]*\nMengatur ulang urutan nomor surat (Berguna untuk mereset nomor kembali ke angka 0 di awal tahun).\n↳ _Contoh: !setnomorsurat yayasan 0_\n\n`;

        teks += `=========================================\n`;
        teks += `💡 _Simpan atau *Pin* pesan ini agar Anda tidak lupa cara menggunakan sistem surat._`;

        // Mengirimkan pesan tanpa pembatasan grup agar bisa dibaca di PC juga
        await msg.reply(teks);
    }
};