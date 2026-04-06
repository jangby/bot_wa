const fs = require('fs');
const path = require('path');

// ⚠️ GANTI NOMOR INI DENGAN NOMOR WA PEMBERI IZIN (Gunakan akhiran @c.us)
const NOMOR_PEMBERI_IZIN = '6285188427706@c.us'; 

module.exports = {
    name: 'izinlab',
    description: 'Fitur pengajuan izin akses lab komputer',
    async execute(client, msg, args, { isOwner, contact }) {
        console.log(`\n[DEBUG IZINLAB] --- PERINTAH !IZINLAB TERPANGGIL ---`);
        console.log(`[DEBUG IZINLAB] Pengirim: ${msg.from}`);
        console.log(`[DEBUG IZINLAB] Apakah dikenali sebagai Owner? : ${isOwner}`);
        
        // Cek Owner
        if (!isOwner) {
            console.log(`[DEBUG IZINLAB] Proses BERHENTI. Pengirim BUKAN Owner.`);
            return msg.reply('❌ Fitur ini khusus untuk Owner Bot!');
        }

        // Cek Path Database
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        console.log(`[DEBUG IZINLAB] Cek file database di: ${dbPath}`);
        
        try {
            if (!fs.existsSync(dbPath)) {
                console.log(`[DEBUG IZINLAB] File JSON belum ada, membuat file baru...`);
                fs.writeFileSync(dbPath, JSON.stringify({}));
            }
        } catch (err) {
            console.error(`[DEBUG IZINLAB] ERROR SAAT MEMBUAT/MEMBACA JSON:`, err);
            return msg.reply('⚠️ Terjadi kesalahan saat membaca database.');
        }

        // JIKA HANYA KETIK !izinlab
        if (args.length === 0) {
            console.log(`[DEBUG IZINLAB] Argumen kosong. Sedang memproses pengiriman template pesan...`);
            try {
                const now = new Date();
                const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
                const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
                
                const jam = String(now.getHours()).padStart(2, '0');
                const menit = String(now.getMinutes()).padStart(2, '0');
                const detik = String(now.getSeconds()).padStart(2, '0');
                const waktuOtomatis = `${hari}, ${now.getDate()} ${bulan} ${now.getFullYear()} - ${jam}:${menit}:${detik} WIB`;

                const template = `*FORMAT IZIN LAB KOMPUTER*\n\nSilakan copy template di bawah ini, isi data yang kosong, dan kirimkan kembali ke bot.\n\n!izinlab\nWaktu: ${waktuOtomatis}\nKeperluan: \nDurasi: [Jam Mulai] s/d [Jam Selesai]\nDaftar Nama:\n1. \n2. \n3. \n4. \n5. `;
                
                await msg.reply(template);
                console.log(`[DEBUG IZINLAB] Template berhasil dikirim ke Owner!`);
                return;
            } catch (err) {
                console.error(`[DEBUG IZINLAB] ERROR SAAT MENGIRIM TEMPLATE:`, err);
                return;
            }
        }

        // JIKA OWNER MENGIRIM KEMBALI FORMAT YANG SUDAH DIISI
        console.log(`[DEBUG IZINLAB] Argumen terdeteksi! Memproses penyimpanan data...`);
        try {
            const isiForm = msg.body.replace(/^!izinlab\s*/i, '').trim();
            const ticketId = 'LAB' + Date.now().toString().slice(-5);
            console.log(`[DEBUG IZINLAB] Membuat Tiket ID: ${ticketId}`);

            const db = JSON.parse(fs.readFileSync(dbPath));
            db[ticketId] = {
                id_tiket: ticketId,
                pengaju: msg.from,
                isi_pengajuan: isiForm,
                status: 'MENUNGGU PERSETUJUAN',
                waktu_dibuat: new Date().toISOString()
            };
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            console.log(`[DEBUG IZINLAB] Data berhasil ditulis ke JSON.`);

            await msg.reply(`⏳ *Pengajuan Diteruskan!*\nID Tiket: *${ticketId}*\nData berhasil disimpan dan sudah dikirim ke Pemberi Izin. Harap tunggu balasannya.`);
            
            // Kirim ke pemberi izin
            console.log(`[DEBUG IZINLAB] Bersiap mengirim pesan ke Nomor Pemberi Izin (${NOMOR_PEMBERI_IZIN})...`);
            let pengajuName = contact.pushname || 'Owner';
            
            // PERUBAHAN TEKS INSTRUKSI DI BAWAH INI
            const pesanPemberiIzin = `🚨 *PERMINTAAN IZIN LAB KOMPUTER BARU* 🚨\n\n*ID Tiket:* ${ticketId}\n*Nama Pengaju:* ${pengajuName}\n\n*Detail Pengajuan:*\n${isiForm}\n\n==========================\n*TOMBOL RESPON OTOMATIS*\n*(Silakan balas / reply pesan ini)*\n\n✅ Ketik: *!izinkan*\n❌ Ketik: *!tolak*`;

            await client.sendMessage(NOMOR_PEMBERI_IZIN, pesanPemberiIzin);
            console.log(`[DEBUG IZINLAB] --- SUKSES KESELURUHAN ---`);

        } catch (err) {
            console.error(`[DEBUG IZINLAB] ERROR SAAT MENYIMPAN/MENGIRIM KE ADMIN:`, err);
            msg.reply('⚠️ Terjadi error saat memproses form. Cek log server.');
        }
    }
};