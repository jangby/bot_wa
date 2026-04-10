const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'templates',
    description: 'Melihat daftar template surat yang tersedia',
    async execute(client, msg, args) {
        const dirPath = path.join(__dirname, '../../data/templates');
        
        // Cek apakah folder ada
        if (!fs.existsSync(dirPath)) {
            return msg.reply('📂 Folder template belum dibuat atau tidak ada template di server.');
        }

        // Ambil semua file yang berakhiran .docx
        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.docx'));

        if (files.length === 0) {
            return msg.reply('📂 Belum ada file template (.docx) di server saat ini.');
        }

        let txt = "🗂️ *DAFTAR TEMPLATE SURAT* 🗂️\n\n";
        txt += "Berikut adalah template dokumen yang siap dicetak:\n\n";

        files.forEach((file, index) => {
            const namaTemplate = file.replace('.docx', '');
            txt += `*${index + 1}.* ${namaTemplate}\n`;
        });

        txt += "\n💡 _Ketik *!cetaksurat [Nama]* untuk melihat format isiannya._\n";
        txt += "↳ _Contoh: !cetaksurat SP1_";

        msg.reply(txt);
    }
};