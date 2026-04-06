const fs = require('fs');
const path = require('path');

const NOMOR_PEMBERI_IZIN = '6285188427706@c.us';

module.exports = {
    name: 'tolak',
    description: 'Menolak persetujuan akses lab (dengan cara reply)',
    async execute(client, msg, args) {
        if (msg.from !== NOMOR_PEMBERI_IZIN) return msg.reply('❌ Anda tidak memiliki otoritas.');

        let ticketId = null;

        // 1. CEK APAKAH ADMIN ME-REPLY PESAN
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const match = quotedMsg.body.match(/ID Tiket:\*?\s*(LAB\d+)/i);
            if (match) {
                ticketId = match[1];
            }
        }

        // 2. JIKA TIDAK ME-REPLY, CEK MANUAL
        if (!ticketId && args.length > 0) {
            ticketId = args[0];
        }

        if (!ticketId) {
            return msg.reply('⚠️ Harap *reply (balas)* pesan permintaan izin dari bot dengan perintah *!tolak*');
        }
        
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data pengajuan lab.');
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        if (!db[ticketId]) return msg.reply('❌ ID Tiket tersebut tidak ditemukan di database!');
        if (db[ticketId].status !== 'MENUNGGU PERSETUJUAN') return msg.reply(`⚠️ Pengajuan ini sudah diproses sebelumnya dengan status: *${db[ticketId].status}*`);

        // Update Data JSON
        db[ticketId].status = 'DITOLAK';
        db[ticketId].waktu_direspon = new Date().toISOString();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Konfirmasi ke yang ACC
        await msg.reply(`❌ Pengajuan Lab (ID: *${ticketId}*) berhasil DITOLAK.`);

        // Teruskan info ke Owner
        const pesanKeOwner = `⚠️ *MOHON MAAF*\n\nPermintaan Izin Lab Komputer (ID: *${ticketId}*) telah *DITOLAK* oleh pengurus.\n\nStatus saat ini: ❌ DITOLAK`;
        await client.sendMessage(db[ticketId].pengaju, pesanKeOwner);
    }
};