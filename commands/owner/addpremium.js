const fs = require('fs');
const path = require('path');

// Path Database
const premPath = path.join(__dirname, '../../data/premium.json');

module.exports = {
    name: 'addpremium',
    description: 'Tambah masa aktif premium user (Khusus Owner)',
    async execute(client, msg, args, { isOwner }) {
        // 1. Cek Owner
        if (!isOwner) return msg.reply('❌ Perintah ini khusus Owner!');

        // 2. Ambil Target
        const mentions = await msg.getMentions();
        
        // Validasi input
        if (mentions.length === 0 || args.length < 2) {
            return msg.reply('❌ Format: *!addpremium @user [jumlah_hari]*\nContoh: *!addpremium @budi 30*');
        }

        const targetContact = mentions[0];
        const targetId = targetContact.id._serialized;
        const days = parseInt(args[args.length - 1]);

        if (isNaN(days)) return msg.reply('❌ Masukkan jumlah hari yang valid!');

        // 3. Load Database
        if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '{}');
        let premiumUsers = JSON.parse(fs.readFileSync(premPath));

        // 4. Hitung Expired Date
        const msPerDay = 24 * 60 * 60 * 1000;
        const now = Date.now();
        let currentExp = premiumUsers[targetId] || now;

        // Jika sudah expired, mulai dari sekarang. Jika belum, tambahkan dari sisa waktu.
        if (currentExp < now) currentExp = now;
        
        const newExp = currentExp + (days * msPerDay);
        premiumUsers[targetId] = newExp;

        // 5. Simpan
        fs.writeFileSync(premPath, JSON.stringify(premiumUsers, null, 2));

        // 6. Konfirmasi
        const dateString = new Date(newExp).toLocaleString('id-ID');
        
        // --- PERBAIKAN DI SINI ---
        // Gunakan 'undefined' di parameter kedua agar options terbaca dengan benar
        await msg.reply(
            `✅ *SUKSES!* User @${targetId.split('@')[0]} sekarang Premium.\n📅 Aktif sampai: *${dateString}*`, 
            undefined, 
            { mentions: [targetContact] }
        );
    }
};