const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'balas',
    description: 'Aktifkan teman ngobrol AI (Auto-Reply)',
    async execute(client, msg, args, { contact }) {
        const senderId = contact.id._serialized;
        const filePath = path.join(__dirname, '../../data/autobalas.json');
        
        let autoBalas = [];
        // Baca file jika sudah ada
        if (fs.existsSync(filePath)) {
            autoBalas = JSON.parse(fs.readFileSync(filePath));
        }

        // Jika nomor belum ada di daftar, masukkan!
        if (!autoBalas.includes(senderId)) {
            autoBalas.push(senderId);
            fs.writeFileSync(filePath, JSON.stringify(autoBalas, null, 2));
            return msg.reply('🤖 *Teman AI Gaul AKTIF!*\n\nSekarang gue bakal bales semua chat lu. Yuk ngobrol! (Ketik *!stop* kalau udah bosen ya)');
        } else {
            return msg.reply('⚠️ Santai bro/sis, mode Auto-Balas AI udah aktif kok dari tadi. Yuk lanjut ngobrol!');
        }
    }
};