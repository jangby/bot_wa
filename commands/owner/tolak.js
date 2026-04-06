const fs = require('fs');
const path = require('path');

const NOMOR_PEMBERI_IZIN = '6282117556309@c.us';

module.exports = {
    name: 'tolak',
    description: 'Menolak persetujuan akses lab',
    async execute(client, msg, args) {
        if (msg.from !== NOMOR_PEMBERI_IZIN) return msg.reply('❌ Anda tidak memiliki otoritas untuk perintah ini.');

        if (args.length === 0) return msg.reply('⚠️ Harap masukkan ID Tiket!\nContoh: *!tolak LAB12345*');
        
        const ticketId = args[0];
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        
        if (!fs.existsSync(dbPath)) return;
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        if (!db[ticketId]) return msg.reply('❌ ID Tiket tersebut tidak ditemukan!');
        if (db[ticketId].status !== 'MENUNGGU PERSETUJUAN') return msg.reply(`⚠️ Pengajuan ini sudah diproses sebelumnya dengan status: *${db[ticketId].status}*`);

        db[ticketId].status = 'DITOLAK';
        db[ticketId].waktu_direspon = new Date().toISOString();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await msg.reply(`❌ Pengajuan dengan ID *${ticketId}* berhasil DITOLAK.`);

        const pesanKeOwner = `⚠️ *MOHON MAAF*\n\nPermintaan Izin Lab Komputer (ID: *${ticketId}*) telah *DITOLAK* oleh pengurus.\n\nStatus saat ini: ❌ DITOLAK`;
        await client.sendMessage(db[ticketId].pengaju, pesanKeOwner);
    }
};