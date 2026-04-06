const fs = require('fs');
const path = require('path');

// ⚠️ NOMOR PEMBERI IZIN HARUS SAMA DENGAN FILE SEBELUMNYA
const NOMOR_PEMBERI_IZIN = '6282117556309@c.us';

module.exports = {
    name: 'izinkan',
    description: 'Memberikan persetujuan akses lab',
    async execute(client, msg, args) {
        // Kunci agar hanya Pemberi Izin yang bisa merespon
        if (msg.from !== NOMOR_PEMBERI_IZIN) return msg.reply('❌ Anda tidak memiliki otoritas untuk menggunakan perintah ini.');

        if (args.length === 0) return msg.reply('⚠️ Harap masukkan ID Tiket!\nContoh: *!izinkan LAB12345*');
        
        const ticketId = args[0];
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data pengajuan lab.');
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        if (!db[ticketId]) return msg.reply('❌ ID Tiket tersebut tidak ditemukan!');
        if (db[ticketId].status !== 'MENUNGGU PERSETUJUAN') return msg.reply(`⚠️ Pengajuan ini sudah diproses sebelumnya dengan status: *${db[ticketId].status}*`);

        // Update Data JSON
        db[ticketId].status = 'DIIZINKAN';
        db[ticketId].waktu_direspon = new Date().toISOString();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Konfirmasi ke yang ACC
        await msg.reply(`✅ Berhasil! Pengajuan dengan ID *${ticketId}* telah DIIZINKAN.`);

        // Teruskan info ke Owner
        const pesanKeOwner = `🎉 *KABAR BAIK!*\n\nPermintaan Izin Lab Komputer (ID: *${ticketId}*) telah *DIIZINKAN* oleh pengurus.\n\nStatus saat ini: ✅ DIIZINKAN`;
        await client.sendMessage(db[ticketId].pengaju, pesanKeOwner);
    }
};