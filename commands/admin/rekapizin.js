const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

// ⚠️ PASTIKAN NOMOR INI SAMA DENGAN LID KAMU YANG KEMARIN (168032676651233@lid)
const NOMOR_PEMBERI_IZIN = '168032676651233@lid';

module.exports = {
    name: 'rekapizin',
    description: 'Download file rekap izin lab format .txt',
    async execute(client, msg, args, { isOwner }) {
        // File hanya boleh diakses oleh Owner bot DAN nomor Pemberi Izin
        if (!isOwner && msg.from !== NOMOR_PEMBERI_IZIN) {
            return msg.reply('❌ Anda tidak memiliki hak akses untuk file ini!');
        }

        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) {
            return msg.reply('📂 Belum ada data pengajuan izin lab saat ini.');
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        // Cek jika datanya kosong
        if (Object.keys(db).length === 0) {
            return msg.reply('📂 Data izin lab masih kosong, belum ada pengajuan.');
        }

        await msg.reply('⏳ Sedang merangkum data menjadi file TXT...');

        // 1. UBAH DATA JSON MENJADI TEKS YANG RAPI (TXT)
        let txtContent = "=========================================\n";
        txtContent += "       REKAP DATA IZIN LAB KOMPUTER      \n";
        txtContent += "=========================================\n\n";

        let nomor = 1;
        for (const ticketId in db) {
            const data = db[ticketId];
            
            // Format waktu agar lebih enak dibaca (opsional)
            const waktuBuat = new Date(data.waktu_dibuat).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            let waktuRespon = "-";
            if (data.waktu_direspon) {
                waktuRespon = new Date(data.waktu_direspon).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }

            txtContent += `[ DATA KE-${nomor} ]\n`;
            txtContent += `ID Tiket     : ${data.id_tiket}\n`;
            txtContent += `Status       : ${data.status}\n`;
            txtContent += `Waktu Dibuat : ${waktuBuat} WIB\n`;
            txtContent += `Direspon Pada: ${waktuRespon} WIB\n`;
            
            if (data.alasan_penolakan) {
                txtContent += `Alasan Tolak : ${data.alasan_penolakan}\n`;
            }

            txtContent += `\n--- DETAIL PENGAJUAN ---\n${data.isi_pengajuan}\n`;
            txtContent += `-----------------------------------------\n\n`;
            nomor++;
        }

        // 2. SIMPAN SEBAGAI FILE .TXT SEMENTARA
        const txtPath = path.join(__dirname, '../../data/rekap_izin_lab.txt');
        fs.writeFileSync(txtPath, txtContent);

        // 3. KIRIM FILE .TXT KE WHATSAPP
        try {
            const fileRekap = MessageMedia.fromFilePath(txtPath);
            await client.sendMessage(msg.from, fileRekap, { caption: '📄 *Berikut adalah file Rekap Data Izin Lab Komputer.*\n\nSilakan download dan buka (format .txt lebih ramah di HP).' });
        } catch (err) {
            console.error('Gagal mengirim file rekap:', err);
            msg.reply('⚠️ Terjadi kesalahan saat mengirim file rekap.');
        }

        // 4. HAPUS FILE SEMENTARA AGAR TIDAK MEMENUHI MEMORI (Dihapus setelah 5 detik)
        setTimeout(() => {
            if (fs.existsSync(txtPath)) {
                fs.unlinkSync(txtPath);
            }
        }, 5000);
    }
};