const uang = require('../../utils/uang');

module.exports = {
    name: 'sapu',
    description: 'Bersihkan 10 pesan terakhir',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return;

        // 1. Cek Apakah Bot Admin? (WAJIB)
        const botId = client.info.wid._serialized;
        const botPart = chat.participants.find(p => p.id._serialized === botId);
        
        if (!botPart || !botPart.isAdmin) {
            return msg.reply('❌ GAGAL! Jadikan saya **Admin Grup** dulu agar bisa menghapus pesan orang lain.');
        }

        // 2. Cek Item Sapu
        const userId = contact.id._serialized;
        if (!uang.useItem(userId, 'sapu')) {
            return msg.reply('❌ Kamu tidak punya *Sapu*! Beli dulu di *!toko*.');
        }

        await msg.reply('🧹 *Wushhh!* Sedang menyapu 10 pesan terakhir...');

        try {
            // Ambil 10 pesan terakhir (termasuk perintah !sapu ini)
            const messages = await chat.fetchMessages({ limit: 10 });
            
            let sukses = 0;
            let gagal = 0;

            for (const m of messages) {
                try {
                    // Hapus pesan (true = Delete for Everyone)
                    await m.delete(true);
                    sukses++;
                    
                    // Jeda 0.5 detik agar tidak dianggap spam oleh WhatsApp
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                } catch (err) {
                    gagal++;
                    // console.error('Gagal hapus pesan:', err);
                }
            }

            // Laporan (Kirim pesan baru karena pesan lama mungkin sudah terhapus)
            await client.sendMessage(chat.id._serialized, `✅ *PEMBERSIHAN SELESAI*\n\n🗑️ Terhapus: ${sukses}\n❌ Gagal: ${gagal}\n\n_Catatan: Bot tidak bisa menghapus pesan yang terlalu lama (lebih dari 2 hari) atau pesan sistem._`);

        } catch (error) {
            console.error(error);
            await client.sendMessage(chat.id._serialized, '❌ Terjadi kesalahan saat mengambil pesan.');
            // Refund item jika error parah
            uang.addItem(userId, 'sapu', 1);
        }
    }
};