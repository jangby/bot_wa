const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'mutasi',
    description: 'Cek riwayat keluar masuk uang (Kirim ke PC)',
    async execute(client, msg, args, { contact, chat }) {
        const userId = contact.id._serialized;
        const pushname = contact.pushname || contact.number;

        // Load Database Mutasi
        const mutasiPath = path.join(__dirname, '../../data/mutasi.json');
        
        if (!fs.existsSync(mutasiPath)) {
            return msg.reply('❌ Belum ada data mutasi sama sekali.');
        }

        const db = JSON.parse(fs.readFileSync(mutasiPath));
        const userMutasi = db[userId];

        // Jika user belum punya riwayat
        if (!userMutasi || userMutasi.length === 0) {
            return msg.reply('📭 Riwayat transaksi kamu masih kosong.');
        }

        // --- BUAT FILE TXT ---
        let content = `====================================\n`;
        content += `RIWAYAT KEUANGAN : ${pushname}\n`;
        content += `ID User          : ${userId}\n`;
        content += `Dicetak Pada     : ${new Date().toLocaleString('id-ID')}\n`;
        content += `====================================\n\n`;

        userMutasi.forEach((m, index) => {
            content += `[${m.date}]\n`;
            content += `Tipe   : ${m.type}\n`;
            content += `Nominal: ${m.amount}\n`;
            content += `Ket    : ${m.desc}\n`;
            content += `------------------------------------\n`;
        });

        content += `\n(Menampilkan 50 transaksi terakhir)`;

        // Simpan ke file sementara
        const fileName = `mutasi_${userId.replace(/\D/g, '')}.txt`; // nama file aman
        const filePath = path.join(__dirname, '../../', fileName);

        fs.writeFileSync(filePath, content);

        try {
            // Beri tahu di grup
            await msg.reply('📩 Sedang mengirim data mutasi ke Chat Pribadi (PC)... Cek ya!');

            // Kirim ke Private Chat
            const media = MessageMedia.fromFilePath(filePath);
            await client.sendMessage(userId, media, { 
                caption: '📊 *LAPORAN MUTASI SALDO*\n\nIni data riwayat transaksi kamu. Simpan baik-baik ya!' 
            });

        } catch (error) {
            console.error('Gagal kirim mutasi:', error);
            msg.reply('❌ Gagal mengirim file ke PC. Pastikan kamu sudah pernah chat bot ini sebelumnya.');
        } finally {
            // Hapus file sementara agar server tidak penuh
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }
};