module.exports = {
    name: 'jenissurat',
    description: 'Menampilkan daftar kode dan jenis surat',
    async execute(client, msg, args) {
        
        let daftarSurat = `🗂️ *DAFTAR KODE & JENIS SURAT* 🗂️\n\n`;
        daftarSurat += `Berikut adalah daftar jenis surat yang didukung oleh sistem saat menggunakan perintah *!addsurat*:\n\n`;
        
        daftarSurat += `🔹 *SK* : Surat Keputusan\n`;
        daftarSurat += `🔹 *SU* : Surat Undangan\n`;
        daftarSurat += `🔹 *SPm* : Surat Permohonan\n`;
        daftarSurat += `🔹 *SPb* : Surat Pemberitahuan\n`;
        daftarSurat += `🔹 *SPp* : Surat Peminjaman\n`;
        daftarSurat += `🔹 *SPn* : Surat Pernyataan\n`;
        daftarSurat += `🔹 *SM* : Surat Mandat\n`;
        daftarSurat += `🔹 *ST* : Surat Tugas\n`;
        daftarSurat += `🔹 *SKet* : Surat Keterangan\n`;
        daftarSurat += `🔹 *SR* : Surat Rekomendasi\n`;
        daftarSurat += `🔹 *SB* : Surat Balasan\n`;
        daftarSurat += `🔹 *SPPD* : Surat Perintah Perjalanan Dinas\n`;
        daftarSurat += `🔹 *SRT* : Sertifikat\n`;
        daftarSurat += `🔹 *PK* : Perjanjian Kerja\n`;
        daftarSurat += `🔹 *SPeng* : Surat Pengantar\n\n`;

        daftarSurat += `💡 _*Tips:* Saat mengisi format !addsurat, Anda boleh mengetik singkatannya (misal: *SU*) ataupun nama lengkapnya (misal: *Undangan*)._`;

        // Mengirimkan pesan daftar surat
        await msg.reply(daftarSurat);
    }
};