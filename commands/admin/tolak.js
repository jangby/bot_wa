const fs = require('fs');
const path = require('path');

// ⚠️ PASTIKAN NOMOR INI SAMA DENGAN LID KAMU YANG KEMARIN (168032676651233@lid)
const NOMOR_PEMBERI_IZIN = '168032676651233@lid';

module.exports = {
    name: 'tolak',
    description: 'Menolak persetujuan akses lab (dengan cara reply beserta alasan)',
    async execute(client, msg, args) {
        if (msg.from !== NOMOR_PEMBERI_IZIN) return msg.reply('❌ Anda tidak memiliki otoritas.');

        let ticketId = null;
        let alasan = "";

        // 1. CEK APAKAH ADMIN ME-REPLY PESAN
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const match = quotedMsg.body.match(/ID Tiket:\*?\s*(LAB\d+)/i);
            if (match) {
                ticketId = match[1];
                // Jika me-reply, semua kata setelah !tolak adalah alasannya
                alasan = args.join(' '); 
            }
        }

        // 2. JIKA TIDAK ME-REPLY, CEK MANUAL (Format: !tolak LABxxx alasan penolakan)
        if (!ticketId && args.length > 0) {
            ticketId = args[0]; // Kata pertama adalah ID
            alasan = args.slice(1).join(' '); // Kata kedua dan seterusnya adalah alasan
        }

        if (!ticketId) {
            return msg.reply('⚠️ Harap *reply (balas)* pesan permintaan izin dari bot dengan perintah *!tolak [alasan]*\n\nContoh: *!tolak sedang ada perbaikan server*');
        }

        // Jika pemberi izin hanya mengetik !tolak tanpa alasan, berikan alasan default
        if (!alasan || alasan.trim() === '') {
            alasan = 'Tidak ada alasan spesifik yang diberikan.';
        }
        
        const dbPath = path.join(__dirname, '../../data/izinlab.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data pengajuan lab.');
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        if (!db[ticketId]) return msg.reply('❌ ID Tiket tersebut tidak ditemukan di database!');
        if (db[ticketId].status !== 'MENUNGGU PERSETUJUAN') return msg.reply(`⚠️ Pengajuan ini sudah diproses sebelumnya dengan status: *${db[ticketId].status}*`);

        // Update Data JSON dengan menambahkan "alasan_penolakan"
        db[ticketId].status = 'DITOLAK';
        db[ticketId].alasan_penolakan = alasan; 
        db[ticketId].waktu_direspon = new Date().toISOString();
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // Konfirmasi ke yang ACC
        await msg.reply(`❌ Pengajuan Lab (ID: *${ticketId}*) berhasil DITOLAK.\n*Alasan:* ${alasan}`);

        // Teruskan info ke Owner beserta alasannya
        const pesanKeOwner = `⚠️ *MOHON MAAF*\n\nPermintaan Izin Lab Komputer (ID: *${ticketId}*) telah *DITOLAK* oleh pengurus.\n\nStatus saat ini: ❌ DITOLAK\n*Alasan Penolakan:* ${alasan}`;
        
        await client.sendMessage(db[ticketId].pengaju, pesanKeOwner);
    }
};