const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'cetaksurat',
    description: 'Auto-generate dokumen surat dari template .docx dengan tanggal otomatis',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        // JIKA HANYA KETIK !cetaksurat
        if (args.length === 0) {
            let info = `🖨️ *FORMAT CETAK SURAT OTOMATIS* 🖨️\n\n`;
            info += `Silakan copy dan isi format di bawah ini. Pastikan nama Template sesuai dengan file .docx yang ada di server.\n\n`;
            info += `!cetaksurat\n`;
            info += `Template: [Nama Template, misal: SP1]\n`;
            info += `nomor: [Nomor Surat]\n`;
            info += `nama: [Nama Santri]\n`;
            info += `kelas: [Kelas]\n\n`;
            info += `_Catatan: Variabel {tanggal} di dalam dokumen akan diisi OTOMATIS dengan tanggal hari ini._`;
            return msg.reply(info);
        }

        // AMBIL DATA DARI PESAN WHATSAPP
        const lines = msg.body.split('\n');
        let templateName = '';
        let dataVariabel = {};

        // Parsing (Membaca baris per baris pesan)
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line === '') continue;

            let parts = line.split(':');
            if (parts.length >= 2) {
                let key = parts.shift().trim().toLowerCase(); 
                let value = parts.join(':').trim(); 

                if (key === 'template') {
                    templateName = value;
                } else {
                    dataVariabel[key] = value;
                }
            }
        }

        if (!templateName) {
            return msg.reply('⚠️ Anda lupa mengisi bagian *Template:*.');
        }

        // --- 🤖 SISTEM OTOMATISASI TANGGAL ---
        // Mendapatkan tanggal hari ini dengan format Bahasa Indonesia (Contoh: 10 April 2026)
        const now = new Date();
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const tanggalHariIni = `${now.getDate()} ${namaBulan[now.getMonth()]} ${now.getFullYear()}`;

        // Masukkan variabel {tanggal} secara otomatis jika user tidak mengetiknya
        if (!dataVariabel.tanggal) {
            dataVariabel.tanggal = tanggalHariIni;
        }
        // -------------------------------------

        const templatePath = path.join(__dirname, '../../data/templates', `${templateName}.docx`);
        if (!fs.existsSync(templatePath)) {
            return msg.reply(`❌ Template surat dengan nama *${templateName}.docx* tidak ditemukan di server.`);
        }

        await msg.reply(`⏳ Sedang merakit dokumen *${templateName}*...`);

        try {
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(dataVariabel);

            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            let namaExport = dataVariabel.nama ? dataVariabel.nama.replace(/\s+/g, '_') : 'Hasil';
            const outputFileName = `${templateName}_${namaExport}_${Date.now()}.docx`;
            const outputPath = path.join(__dirname, '../../data/templates', outputFileName);

            fs.writeFileSync(outputPath, buf);

            const media = MessageMedia.fromFilePath(outputPath);
            await client.sendMessage(msg.from, media, { caption: `✅ *DOKUMEN SELESAI DICETAK*\n\nBerikut adalah file surat hasil *generate* otomatis. Silakan diunduh.` });

            setTimeout(() => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, 5000);

        } catch (error) {
            console.error('Error saat merender docx:', error);
            msg.reply(`❌ Terjadi kesalahan saat memproses template surat. Pastikan penulisan {kurung_kurawal} di dalam Word sudah benar.`);
        }
    }
};