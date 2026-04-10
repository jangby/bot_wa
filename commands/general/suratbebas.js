const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'suratbebas',
    description: 'Membuat surat dinamis dari template blank (Yayasan/Pesantren)',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini khusus di dalam Grup!');

        if (args.length === 0 && !msg.body.includes('\n')) {
            let panduan = `📝 *FORMAT SURAT BEBAS DINAMIS* 📝\n\n`;
            panduan += `Silakan copy format di bawah ini, isi datanya, lalu kirimkan kembali ke grup.\n\n`;
            panduan += `.!suratbebas\n`;
            panduan += `Instansi: [Yayasan / Pesantren]\n`;
            panduan += `Judul: SURAT PEMBERITAHUAN\n`;
            panduan += `Nomor: 001/YAY/IV/2026\n`;
            panduan += `Perihal: Undangan Wali Santri\n`;
            panduan += `Kota Tanggal: Jakarta, 10 April 2026\n\n`;
            panduan += `=== ISI SURAT ===\n`;
            panduan += `Assalamu'alaikum Wr. Wb.\n\n`;
            panduan += `Dengan hormat,\nIsi paragraf surat bebas di sini, bisa panjang dan beberapa paragraf sekaligus...\n\n`;
            panduan += `Wassalamu'alaikum Wr. Wb.\n\n`;
            panduan += `=== TANDA TANGAN ===\n`;
            panduan += `_Ketik Jabatan | Nama (pisahkan dengan garis lurus | ). Maksimal 2 orang_\n`;
            panduan += `Sekretaris | Ahmad Fulan, S.Pd\n`;
            panduan += `Ketua Yayasan | H. Budi Santoso\n`;
            return msg.reply(panduan);
        }

        const lines = msg.body.split('\n');
        
        let dataVariabel = {
            judul: '', nomor: '', perihal: '', kota_tanggal: '',
            isi: '',
            jabatan_kiri: '', nama_kiri: '',
            jabatan_kanan: '', nama_kanan: ''
        };
        let instansi = '';

        // Mode Pembacaan (Smart Parser)
        let mode = 'header'; 
        let arrayIsi = [];
        let arrayTtd = [];

        for (let i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line === '' && mode !== 'isi') continue;

            // Pindah Mode Pembacaan
            if (line.toUpperCase().includes('=== ISI SURAT ===')) { mode = 'isi'; continue; }
            if (line.toUpperCase().includes('=== TANDA TANGAN ===')) { mode = 'ttd'; continue; }

            if (mode === 'header') {
                let parts = line.split(':');
                if (parts.length >= 2) {
                    let key = parts.shift().trim().toLowerCase();
                    let value = parts.join(':').trim();
                    if (key === 'instansi') instansi = value.toLowerCase();
                    if (key === 'judul') dataVariabel.judul = value;
                    if (key === 'nomor') dataVariabel.nomor = value;
                    if (key === 'perihal') dataVariabel.perihal = value;
                    if (key === 'kota tanggal') dataVariabel.kota_tanggal = value;
                }
            } else if (mode === 'isi') {
                arrayIsi.push(line);
            } else if (mode === 'ttd') {
                if (line.includes('|')) arrayTtd.push(line);
            }
        }

        // Gabungkan paragraf isi dengan enter asli
        dataVariabel.isi = arrayIsi.join('\n').trim();

        // LOGIKA POSISI TANDA TANGAN (Kiri dan Kanan)
        if (arrayTtd.length === 1) {
            // Jika cuma 1 orang, taruh di Kanan (Format standar Indonesia)
            let parts = arrayTtd[0].split('|');
            dataVariabel.jabatan_kanan = parts[0].trim();
            dataVariabel.nama_kanan = parts[1].trim();
        } else if (arrayTtd.length >= 2) {
            // Jika 2 orang, Orang ke-1 di Kiri, Orang ke-2 di Kanan
            let partsKiri = arrayTtd[0].split('|');
            dataVariabel.jabatan_kiri = partsKiri[0].trim();
            dataVariabel.nama_kiri = partsKiri[1].trim();

            let partsKanan = arrayTtd[1].split('|');
            dataVariabel.jabatan_kanan = partsKanan[0].trim();
            dataVariabel.nama_kanan = partsKanan[1].trim();
        }

        if (instansi !== 'yayasan' && instansi !== 'pesantren') {
            return msg.reply('⚠️ Pada bagian *Instansi:*, harap isi dengan *Yayasan* atau *Pesantren*.');
        }

        const templateName = instansi === 'yayasan' ? 'blank_yayasan.docx' : 'blank_pesantren.docx';
        const templatePath = path.join(__dirname, '../../data/templates', templateName);

        if (!fs.existsSync(templatePath)) {
            return msg.reply(`❌ Master template *${templateName}* tidak ditemukan di folder templates server.`);
        }

        await msg.reply(`⏳ Sedang menyusun surat dinamis untuk *${instansi.toUpperCase()}*...`);

        try {
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            doc.render(dataVariabel);

            const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

            // Nama file dinamis
            let perihalNama = dataVariabel.perihal ? dataVariabel.perihal.replace(/[^a-zA-Z0-9]/g, '_') : 'Bebas';
            const outputFileName = `Surat_${instansi}_${perihalNama}_${Date.now()}.docx`;
            const outputPath = path.join(__dirname, '../../data/templates', outputFileName);

            fs.writeFileSync(outputPath, buf);

            const media = MessageMedia.fromFilePath(outputPath);
            await client.sendMessage(msg.from, media, { caption: `✅ *SURAT BERHASIL DISUSUN*\n\nBerikut adalah surat dinamis Anda. Paragraf dan tanda tangan telah diatur otomatis.` });

            // Bersihkan file sisa
            setTimeout(() => { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); }, 5000);

        } catch (error) {
            console.error('Error docxtemplater:', error);
            msg.reply('❌ Terjadi kesalahan saat menyusun dokumen. Pastikan penulisan variabel di file Word sudah benar.');
        }
    }
};