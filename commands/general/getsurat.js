const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'getsurat',
    description: 'Mendownload berkas surat yang sudah diarsipkan',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam Grup!');

        if (args.length === 0) return msg.reply('⚠️ Harap masukkan ID Surat!\nContoh: *!getsurat YAY001*');

        const targetId = args[0].toUpperCase();
        
        const dbPath = path.join(__dirname, '../../data/surat.json');
        if (!fs.existsSync(dbPath)) return msg.reply('📂 Belum ada data surat saat ini.');
        const db = JSON.parse(fs.readFileSync(dbPath));

        // Cari surat
        let targetSurat = db.yayasan.list.find(s => s.id === targetId) || db.pesantren.list.find(s => s.id === targetId);
        
        if (!targetSurat) return msg.reply(`❌ Data Surat dengan ID *${targetId}* tidak ditemukan!`);

        // Cek apakah surat ini sudah pernah diarsipkan dokumennya
        if (!targetSurat.file_arsip) {
            return msg.reply(`⚠️ Surat dengan ID *${targetId}* hanya ada nomornya, berkas fisiknya belum pernah diarsipkan.\nSilakan upload terlebih dahulu menggunakan perintah *!arsipsurat ${targetId}*`);
        }

        const filePath = path.join(__dirname, '../../data/arsip_surat', targetSurat.file_arsip);

        // Jika filenya tiba-tiba hilang di server
        if (!fs.existsSync(filePath)) {
            return msg.reply('❌ Berkas fisik tidak ditemukan di server (mungkin file telah dihapus manual dari server).');
        }

        try {
            await msg.reply('⏳ Memproses pengiriman berkas dari server...');
            
            // Mengubah file lokal menjadi Media WhatsApp
            const media = MessageMedia.fromFilePath(filePath);
            
            // Kirim media
            const captionMsg = `🗄️ *BERKAS ARSIP DITEMUKAN*\n\n*ID:* ${targetId}\n*Nomor:* ${targetSurat.nomor_surat}\n*Perihal:* ${targetSurat.nama_surat}`;
            await client.sendMessage(msg.from, media, { caption: captionMsg });

        } catch (err) {
            console.error('Error kirim file:', err);
            msg.reply('❌ Gagal mengirim berkas surat.');
        }
    }
};