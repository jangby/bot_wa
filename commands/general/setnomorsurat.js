const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setnomorsurat',
    description: 'Mengatur atau mereset nomor urut terakhir untuk sistem surat',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // Hanya bisa di grup dan oleh Admin Grup / Owner
        if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');
        
        if (!isAdmin && !isOwner) {
            return msg.reply('❌ Akses Ditolak! Hanya *Admin Grup* dan *Owner Bot* yang bisa mengatur atau mereset urutan nomor surat.');
        }

        if (args.length < 2) {
            return msg.reply('⚠️ Format salah!\n\nCara penggunaan:\n*!setnomorsurat [kategori] [nomor]*\n\nContoh mengatur Yayasan mulai dari nomor 10:\n*!setnomorsurat yayasan 10*\n\nContoh mereset Pesantren awal tahun ke 0:\n*!setnomorsurat pesantren 0*');
        }

        const kategori = args[0].toLowerCase();
        const nomorBaru = parseInt(args[1]);

        if (kategori !== 'yayasan' && kategori !== 'pesantren') {
            return msg.reply('⚠️ Kategori hanya boleh diisi dengan *yayasan* atau *pesantren*.');
        }

        if (isNaN(nomorBaru) || nomorBaru < 0) {
            return msg.reply('⚠️ Nomor urut harus berupa angka dan tidak boleh kurang dari 0.');
        }

        const dbPath = path.join(__dirname, '../../data/surat.json');
        
        // Cek jika database belum pernah dibuat sama sekali
        if (!fs.existsSync(dbPath)) {
            const initialData = { yayasan: { last_number: 0, list: [] }, pesantren: { last_number: 0, list: [] } };
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        // Simpan nomor urut lama untuk info di pesan balasan
        const nomorLama = db[kategori].last_number;
        
        // Ubah ke nomor urut baru
        db[kategori].last_number = nomorBaru;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        msg.reply(`✅ *NOMOR URUT BERHASIL DIATUR*\n\nKategori: *${kategori.toUpperCase()}*\nNomor Sebelumnya: *${nomorLama}*\nNomor Saat Ini: *${nomorBaru}*\n\n_Informasi: Surat yang dibuat oleh anggota selanjutnya ( !addsurat ) akan otomatis menggunakan nomor urut ${nomorBaru + 1}._`);
    }
};