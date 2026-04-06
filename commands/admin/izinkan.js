const fs = require('fs');
const path = require('path');

// ⚠️ NOMOR PEMBERI IZIN HARUS SAMA
const NOMOR_PEMBERI_IZIN = '168032676651233@lid';

module.exports = {
    name: 'izinkan',
    description: 'Memberikan persetujuan akses lab (dengan cara reply)',
    async execute(client, msg, args) {
        console.log("NOMOR YANG NGETIK:", msg.from); 
        console.log("NOMOR DI SISTEM:", NOMOR_PEMBERI_IZIN);
        if (msg.from !== NOMOR_PEMBERI_IZIN) return msg.reply('❌ Anda tidak memiliki otoritas.');

        let ticketId = null;

        // 1. CEK APAKAH ADMIN ME-REPLY PESAN
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            // Gunakan Regex untuk mencari teks "ID Tiket: LABxxx" di pesan yang di-reply
            const match = quotedMsg.body.match(/ID Tiket:\*?\s*(LAB\d+)/i);
            if (match) {
                ticketId = match[1]; // Mengambil tulisan LABxxx
            }
        }

        // 2. JIKA TIDAK ME-REPLY, CEK APAKAH ADMIN MENGETIK MANUAL (Sebagai Backup)
        if (!ticketId && args.length > 0) {
            ticketId = args[0];
        }

        // Jika tetap tidak ketemu ID-nya
        if (!ticketId) {
            return msg.reply('⚠️ Harap *reply (balas)* pesan permintaan izin dari bot dengan perintah *!izinkan*');
        }
        
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data pengajuan lab.');
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        if (!db[ticketId]) return msg.reply('❌ ID Tiket tersebut tidak ditemukan di database!');
        if (db[ticketId].status !== 'MENUNGGU PERSETUJUAN') return msg.reply(`⚠️ Pengajuan ini sudah diproses sebelumnya dengan status: *${db[ticketId].status}*`);

        // Update Data JSON
        db[ticketId].status = 'DIIZINKAN';
        db[ticketId].waktu_direspon = new Date().toISOString();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Konfirmasi ke yang ACC
        await msg.reply(`✅ Berhasil! Pengajuan Lab (ID: *${ticketId}*) telah DIIZINKAN.`);

        // Teruskan info ke Owner
        const pesanKeOwner = `🎉 *KABAR BAIK!*\n\nPermintaan Izin Lab Komputer (ID: *${ticketId}*) telah *DIIZINKAN* oleh pengurus.\n\nStatus saat ini: ✅ DIIZINKAN`;
        await client.sendMessage(db[ticketId].pengaju, pesanKeOwner);
    }
};