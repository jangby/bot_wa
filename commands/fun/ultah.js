const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ultah',
    description: 'Cek ulang tahun member',
    async execute(client, msg, args, { contact }) {
        const dbPath = path.join(__dirname, '../../data/ultah.json');
        const db = JSON.parse(fs.readFileSync(dbPath));
        
        // Jika tag orang
        const targetId = msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : contact.id._serialized;
        
        if (!db[targetId]) return msg.reply('❌ Orang ini belum set ulang tahun. Ketik *!setultah* dulu.');

        const tglLahir = db[targetId]; // 17-08-2000
        const [hari, bulan, tahun] = tglLahir.split('-');
        
        const today = new Date();
        const nextUltah = new Date(today.getFullYear(), parseInt(bulan) - 1, parseInt(hari));
        
        if (today > nextUltah) {
            nextUltah.setFullYear(today.getFullYear() + 1);
        }

        const selisihWaktu = nextUltah - today;
        const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));
        const umur = today.getFullYear() - parseInt(tahun);

        msg.reply(`🎂 *INFO ULANG TAHUN* 🎂\n\n📅 Tanggal: ${tglLahir}\n⏳ Kurang: ${selisihHari} hari lagi\n🎉 Umur skrg/nanti: ${umur} Tahun`);
    }
};