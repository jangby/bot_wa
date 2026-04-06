const fs = require('fs');
const path = require('path');

// ⚠️ GANTI NOMOR INI DENGAN NOMOR WA PEMBERI IZIN (Gunakan akhiran @c.us)
const NOMOR_PEMBERI_IZIN = '6282117556309@c.us'; 

module.exports = {
    name: 'izinlab',
    description: 'Fitur pengajuan izin akses lab komputer',
    async execute(client, msg, args, { isOwner, contact }) {
        // Hanya Owner yang bisa menggunakan
        if (!isOwner) return msg.reply('❌ Fitur ini khusus untuk Owner Bot!');

        // Buat file database JSON jika belum ada
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

        // JIKA HANYA KETIK !izinlab (Bot kirim format kosong)
        if (args.length === 0) {
            const now = new Date();
            const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
            const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
            
            const jam = String(now.getHours()).padStart(2, '0');
            const menit = String(now.getMinutes()).padStart(2, '0');
            const detik = String(now.getSeconds()).padStart(2, '0');
            const waktuOtomatis = `${hari}, ${now.getDate()} ${bulan} ${now.getFullYear()} - ${jam}:${menit}:${detik} WIB`;

            const template = `*FORMAT IZIN LAB KOMPUTER*\n\nSilakan copy template di bawah ini, isi data yang kosong, dan kirimkan kembali ke bot.\n\n!izinlab\nWaktu: ${waktuOtomatis}\nKeperluan: \nDurasi: [Jam Mulai] s/d [Jam Selesai]\nDaftar Nama:\n1. \n2. \n3. \n4. \n5. `;
            
            return msg.reply(template);
        }

        // JIKA OWNER MENGIRIM KEMBALI FORMAT YANG SUDAH DIISI
        const isiForm = args.join(' ');
        const ticketId = 'LAB' + Date.now().toString().slice(-5); // Membuat ID Tiket Unik, misal LAB12345

        // Simpan data JSON dengan rapih
        const db = JSON.parse(fs.readFileSync(dbPath));
        db[ticketId] = {
            id_tiket: ticketId,
            pengaju: msg.from,
            isi_pengajuan: isiForm,
            status: 'MENUNGGU PERSETUJUAN',
            waktu_dibuat: new Date().toISOString()
        };
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Balas ke Owner
        await msg.reply(`⏳ *Pengajuan Diteruskan!*\nID Tiket: *${ticketId}*\nData berhasil disimpan dan sudah dikirim ke Pemberi Izin. Harap tunggu balasannya.`);

        // Format pesan rapih ke Pemberi Izin
        const pesanPemberiIzin = `🚨 *PERMINTAAN IZIN LAB KOMPUTER BARU* 🚨\n\n*ID Tiket:* ${ticketId}\n*Nama Pengaju:* ${contact.pushname || 'Owner'}\n\n*Detail Pengajuan:*\n${isiForm}\n\n==========================\n*TOMBOL RESPON OTOMATIS*\n*(Balas pesan ini dengan perintah di bawah)*\n\n✅ Ketik: *!izinkan ${ticketId}*\n❌ Ketik: *!tolak ${ticketId}*`;

        try {
            await client.sendMessage(NOMOR_PEMBERI_IZIN, pesanPemberiIzin);
        } catch (err) {
            console.log('Error kirim pesan izin:', err);
            msg.reply('⚠️ Sistem gagal mengirim pesan ke nomor pemberi izin. Pastikan nomor sudah benar dan terdaftar.');
        }
    }
};