const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'rekapsurat',
    description: 'Mendownload file rekap seluruh data surat (TXT)',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        
        const db = JSON.parse(fs.readFileSync(dbPath));

        // Jika data benar-benar kosong
        if (db.yayasan.list.length === 0 && db.pesantren.list.length === 0) {
            return msg.reply('📂 Data surat masih kosong, belum ada satupun surat yang dibuat.');
        }

        await msg.reply('⏳ Sedang menyusun laporan rekap surat menjadi file TXT...');

        let txtContent = "=========================================\n";
        txtContent += "    BUKU BESAR REKAP NOMOR SURAT INSTITUSI   \n";
        txtContent += `    Diunduh Pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n`;
        txtContent += "=========================================\n\n";

        // Fungsi penyusun format per kategori
        const susunKategori = (nama, list) => {
            let res = `--- KATEGORI: ${nama.toUpperCase()} ---\n\n`;
            if (list.length === 0) return res += "Belum ada data surat.\n\n";
            
            list.forEach(s => {
                const tgl = new Date(s.tanggal).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                res += `ID Surat   : ${s.id}\n`;
                res += `Nomor      : ${s.nomor_surat}\n`;
                res += `Perihal    : ${s.nama_surat}\n`;
                res += `Waktu Buat : ${tgl} WIB\n`;
                res += `Status Arsip: ${s.file_arsip ? 'BERKAS TERSEDIA DI SERVER' : 'BERKAS BELUM DIUPLOAD'}\n`;
                res += `-----------------------------------------\n`;
            });
            return res + "\n";
        };

        txtContent += susunKategori('Yayasan', db.yayasan.list);
        txtContent += susunKategori('Pesantren', db.pesantren.list);

        // Simpan file sementara
        const txtPath = path.join(__dirname, '../../data/Laporan_Rekap_Surat.txt');
        fs.writeFileSync(txtPath, txtContent);

        try {
            const media = MessageMedia.fromFilePath(txtPath);
            await client.sendMessage(msg.from, media, { caption: '📄 *LAPORAN BUKU BESAR SURAT*\n\nBerikut adalah file rekapan seluruh surat yang ada di database. Silakan unduh.' });
        } catch (err) {
            msg.reply('❌ Terjadi kesalahan saat mengirim file rekap.');
        }

        // Hapus file sementara dari server setelah 5 detik
        setTimeout(() => {
            if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
        }, 5000);
    }
};