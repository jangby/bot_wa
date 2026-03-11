const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'stop',
    description: 'Matikan teman ngobrol AI',
    async execute(client, msg, args, { contact }) {
        const senderId = contact.id._serialized;
        const filePath = path.join(__dirname, '../../data/autobalas.json');
        
        if (fs.existsSync(filePath)) {
            let autoBalas = JSON.parse(fs.readFileSync(filePath));
            
            // Jika nomornya ada di daftar, hapus!
            if (autoBalas.includes(senderId)) {
                autoBalas = autoBalas.filter(id => id !== senderId);
                fs.writeFileSync(filePath, JSON.stringify(autoBalas, null, 2));
                return msg.reply('🛑 *Teman AI Gaul DIMATIKAN!*\n\nOke deh, gue pamit dulu ya. Ketik *!balas* kalau mau ngobrol lagi!');
            }
        }
        return msg.reply('⚠️ Kamu belum mengaktifkan mode Auto-Balas. Ketik *!balas* untuk mengaktifkan.');
    }
};