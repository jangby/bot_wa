const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
    name: 'topup',
    description: 'Topup saldo via transfer',
    async execute(client, msg, args, { contact }) {
        // MODE 1: Info Topup (Tanpa Argumen / Tanpa Gambar)
        if (args.length === 0 && !msg.hasMedia) {
            try {
                // Load gambar dari folder root (pastikan nama file sesuai)
                const media = MessageMedia.fromFilePath(path.join(__dirname, '../../qr_dana.jpeg'));
                
                const text = `💰 *CARA TOPUP SALDO* 💰
                
1. Scan QRIS di atas atau transfer ke DANA/Gopay: *0851-3646-8097*
2. Kirim bukti transfer di sini dengan caption:
   *!topup [nama_kamu]*
   
Contoh: Kirim gambar bukti, kasih caption *!topup Budi*`;

                await client.sendMessage(msg.from, media, { caption: text });
            } catch (e) {
                console.error('Error loading QR:', e);
                msg.reply('❌ Gagal memuat gambar QR. Pastikan file "qr_dana.jpeg" ada di folder bot.');
            }
            return;
        }

        // MODE 2: Request Topup (Harus ada Gambar)
        if (msg.hasMedia) {
            if (args.length === 0) return msg.reply('❌ Tulis namamu! Contoh caption: *!topup Budi*');
            
            const nama = args.join(' ');
            const userId = contact.id._serialized; // ID User untuk diisi saldo nanti
            
            try {
                // Download bukti tf
                const media = await msg.downloadMedia();
                
                // Format pesan rapi untuk Owner
                // PENTING: Jangan ubah format "🆔 ID:" karena akan dipakai bot untuk membaca ID user
                const captionOwner = `📢 *REQUEST TOPUP BARU* 📢
            
👤 Nama: ${nama}
🆔 ID: ${userId}
📅 Tanggal: ${new Date().toLocaleString()}

_Owner: Reply pesan ini dengan "YA [nominal]" untuk konfirmasi._
_Contoh: YA 50000_`;

                // Kirim ke Owner (Ambil nomor dari config.js)
                await client.sendMessage(config.ownerNumber, media, { caption: captionOwner });
                
                msg.reply('✅ *Permintaan dikirim!* Tunggu verifikasi admin ya. Saldo akan masuk otomatis jika disetujui.');
            
            } catch (error) {
                console.error(error);
                msg.reply('❌ Gagal mengirim bukti. Coba lagi.');
            }
        } else {
            msg.reply('❌ Sertakan gambar bukti transfer! Caranya: Upload gambar -> Kasih caption *!topup Nama*');
        }
    }
};