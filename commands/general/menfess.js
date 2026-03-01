const uang = require('../../utils/uang');

module.exports = {
    name: 'menfess',
    description: 'Kirim pesan rahasia (Butuh item Surat)',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;

        // Cek args
        if (args.length < 2) return msg.reply('❌ Format: *!menfess [nomor_tujuan] [pesan]*\nContoh: *!menfess 62812345xxx Halo aku suka kamu*');

        // Cek Item
        if (!uang.useItem(userId, 'surat')) {
            return msg.reply('❌ Kamu tidak punya *Surat*! Beli dulu di *!toko*.');
        }

        let targetNumber = args[0];
        const pesanIsi = args.slice(1).join(' ');

        // Format nomor (hapus 0, tambah 62, hapus spasi/-)
        targetNumber = targetNumber.replace(/[^0-9]/g, '');
        if (targetNumber.startsWith('0')) targetNumber = '62' + targetNumber.slice(1);
        if (!targetNumber.endsWith('@c.us')) targetNumber += '@c.us';

        try {
            // Cek apakah Target punya Kacamata Dukun?
            const invTarget = uang.cekInventory(targetNumber.replace('@c.us', '')); // Sesuaikan ID
            let footer = `_Pesan ini dikirim seseorang menggunakan Bot._`;
            
            // Kacamata tidak hilang (Permanent Item) karena mahal
            if (invTarget['kacamata'] && invTarget['kacamata'] > 0) {
                const pengirimNama = contact.pushname || contact.number;
                footer = `\n👁️ *KACAMATA DUKUN AKTIF*\nPengirim: ${pengirimNama} (${contact.number})`;
            }

            await client.sendMessage(targetNumber, `📩 *PESAN RAHASIA (MENFESS)* 📩\n\n"${pesanIsi}"\n\n${footer}`);
            
            msg.reply(`✅ Surat terkirim!`);
        } catch (e) {
            msg.reply('❌ Nomor tidak terdaftar di WhatsApp atau bot diblokir.');
            // Refund item kalau gagal (opsional)
            uang.addItem(userId, 'surat', 1); 
        }
    }
};