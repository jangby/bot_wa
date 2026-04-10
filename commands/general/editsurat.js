const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'editsurat',
    description: 'Koreksi judul/perihal surat tanpa menghapusnya',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');
        
        // Proteksi keamanan: Hanya admin grup / owner yang bisa edit
        if (!isAdmin && !isOwner) {
            return msg.reply('❌ Akses Ditolak! Hanya *Admin Grup* yang bisa mengoreksi data surat.');
        }

        if (args.length < 2) {
            return msg.reply('⚠️ Format salah!\n\nCara penggunaan:\n*!editsurat [ID SURAT] [Perihal Baru]*\n\nContoh:\n*!editsurat YAY001 Rapat Bulanan Wali Santri*');
        }

        const targetId = args[0].toUpperCase();
        const perihalBaru = args.slice(1).join(' ');

        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        let found = false;
        let targetSurat = null;

        // Cari di Yayasan
        let index = db.yayasan.list.findIndex(s => s.id === targetId);
        if (index !== -1) { found = true; targetSurat = db.yayasan.list[index]; }

        // Jika tidak ketemu, cari di Pesantren
        if (!found) {
            index = db.pesantren.list.findIndex(s => s.id === targetId);
            if (index !== -1) { found = true; targetSurat = db.pesantren.list[index]; }
        }

        if (!found) return msg.reply(`❌ Data Surat dengan ID *${targetId}* tidak ditemukan!`);

        // Simpan nama yang lama untuk info
        const namaLama = targetSurat.nama_surat;
        
        // Update datanya
        targetSurat.nama_surat = perihalBaru;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`✅ *DATA SURAT BERHASIL DIKOREKSI*\n\n*ID:* ${targetId}\n*Nomor:* ${targetSurat.nomor_surat}\n\n*Perihal Lama:* ${namaLama}\n*Perihal Baru:* ${perihalBaru}`);
    }
};