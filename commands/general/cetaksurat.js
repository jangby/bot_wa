const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'cetaksurat',
    description: 'Auto-generate dokumen surat dengan fitur baca variabel otomatis',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        // 1. JIKA HANYA MENGETIK !cetaksurat (Tanpa argumen nama template)
        if (args.length === 0 && !msg.body.includes('\n')) {
            return msg.reply('⚠️ Harap masukkan nama template atau ketik *!templates* untuk melihat daftarnya.\n\nContoh penggunaan:\n*!cetaksurat SP1*');
        }

        // 2. FITUR SCAN VARIABLE: JIKA MENGETIK "!cetaksurat SP1"
        if (args.length === 1 && !msg.body.includes('\n')) {
            const templateName = args[0];
            const templatePath = path.join(__dirname, '../../data/templates', `${templateName}.docx`);
            
            if (!fs.existsSync(templatePath)) {
                return msg.reply(`❌ Template *${templateName}.docx* tidak ditemukan. Ketik *!templates* untuk melihat daftar file yang ada.`);
            }

            try {
                // Bongkar file Word untuk mengekstrak teks aslinya
                const content = fs.readFileSync(templatePath, 'binary');
                const zip = new PizZip(content);
                const xml = zip.file("word/document.xml").asText();
                
                // Bersihkan tag XML agar variabel {nama} tidak terpotong oleh format font Word
                const pureText = xml.replace(/<[^>]+>/g, '');
                
                // Cari semua kata yang diapit tanda { }
                const regex = /\{([a-zA-Z0-9_]+)\}/g;
                let match;
                const variables = new Set();
                
                while ((match = regex.exec(pureText)) !== null) {
                    const varName = match[1].toLowerCase();
                    // Abaikan variabel tanggal karena sudah otomatis
                    if (varName !== 'tanggal') {
                        variables.add(varName);
                    }
                }

                if (variables.size === 0) {
                    return msg.reply(`⚠️ Template *${templateName}* tidak memiliki variabel { } yang perlu diisi.`);
                }

                // Susun pesan balasan ke pengguna
                let formatIsian = `*FORMAT ISIAN: ${templateName.toUpperCase()}*\n\n`;
                formatIsian += `Silakan copy teks di bawah ini, *hapus tanda titik (.)* di awal baris, isi data-datanya, lalu kirimkan:\n\n`;
                
                // Format menggunakan .!cetaksurat agar tidak dibaca ulang oleh bot (mencegah error)
                formatIsian += `.!cetaksurat\n`;
                formatIsian += `Template: ${templateName}\n`;
                
                variables.forEach(v => {
                    formatIsian += `${v}: \n`;
                });

                return msg.reply(formatIsian);

            } catch (error) {
                console.error('Gagal membaca variabel template:', error);
                return msg.reply('❌ Gagal membaca isi template. Pastikan file Word tidak rusak/corrupt.');
            }
        }

        // 3. JIKA USER MENGIRIM FORMAT YANG SUDAH DIISI (Ada enter/baris baru)
        const lines = msg.body.split('\n');
        let templateName = '';
        let dataVariabel = {};

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

        // --- SISTEM TANGGAL OTOMATIS ---
        const now = new Date();
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const tanggalHariIni = `${now.getDate()} ${namaBulan[now.getMonth()]} ${now.getFullYear()}`;

        if (!dataVariabel.tanggal) {
            dataVariabel.tanggal = tanggalHariIni;
        }
        // -------------------------------

        const templatePath = path.join(__dirname, '../../data/templates', `${templateName}.docx`);
        if (!fs.existsSync(templatePath)) {
            return msg.reply(`❌ Template surat *${templateName}.docx* tidak ditemukan.`);
        }

        await msg.reply(`⏳ Sedang merakit dokumen *${templateName}*...`);

        try {
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            doc.render(dataVariabel);

            const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

            // Coba cari nama untuk nama file dari input (misal ada variabel nama/santri)
            let valPertama = Object.values(dataVariabel).find(v => v !== templateName && v !== tanggalHariIni && v !== '');
            let namaExport = valPertama ? valPertama.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) : 'Hasil';
            
            const outputFileName = `${templateName}_${namaExport}_${Date.now()}.docx`;
            const outputPath = path.join(__dirname, '../../data/templates', outputFileName);

            fs.writeFileSync(outputPath, buf);

            const media = MessageMedia.fromFilePath(outputPath);
            await client.sendMessage(msg.from, media, { caption: `✅ *DOKUMEN SELESAI DICETAK*\n\nBerikut adalah file surat hasil *generate* otomatis.` });

            setTimeout(() => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, 5000);

        } catch (error) {
            console.error('Error saat merender docx:', error);
            msg.reply(`❌ Terjadi kesalahan saat memproses template. Pastikan kurung kurawal { } di dalam Word penulisannya benar.`);
        }
    }
};