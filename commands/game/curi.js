const uang = require('../../utils/uang');

module.exports = {
    name: 'curi',
    description: 'Curi uang teman (Butuh Item Tuyul)',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa di grup!');

        // 1. Cek Item Tuyul
        const senderId = contact.id._serialized;
        const inventory = uang.cekInventory(senderId);
        
        if (!inventory['tuyul'] || inventory['tuyul'] < 1) {
            return msg.reply('❌ Kamu gak punya *Tuyul*! Beli dulu di *!toko*.');
        }

        // 2. Ambil Target (FIX ID LID)
        const mentions = await msg.getMentions();
        if (mentions.length === 0) return msg.reply('❌ Mau nyuri punya siapa? Tag orangnya!');

        const targetId = mentions[0].id._serialized; // Pasti dapat @c.us

        if (targetId === senderId) return msg.reply('❌ Tuyul bingung disuruh nyuri uang majikan sendiri.');

        // 3. Cek Pengaman (Celengan/Anjing Penjaga)
        const targetInv = uang.cekInventory(targetId);
        if (targetInv['celengan'] > 0) {
            uang.useItem(targetId, 'celengan'); // Korban kehilangan celengan
            // Pencuri ketahuan (Denda)
            const denda = 5000;
            uang.kurangSaldo(senderId, denda);
            
            return msg.reply(`🛡️ *GAGAL!* Target punya Celengan Babi!\nTuyulmu terpental dan kamu didenda *${uang.formatRupiah(denda)}* karena ketahuan warga.`);
        }

        // 4. Cek Saldo Target
        const targetSaldo = uang.cekSaldo(targetId);
        if (targetSaldo < 5000) {
            return msg.reply('❌ Target miskin banget, gak ada yang bisa dicuri. Tuyulmu nangis melihat kemiskinan ini.');
        }

        // 5. Eksekusi Pencurian
        // Sukses rate 50%
        const isSukses = Math.random() > 0.5;

        if (isSukses) {
            // Curi 5% - 15%
            const persentase = Math.floor(Math.random() * 11) + 5; 
            const stolen = Math.floor(targetSaldo * (persentase / 100));

            uang.kurangSaldo(targetId, stolen);
            uang.addSaldo(senderId, stolen);

            await chat.sendMessage(`👻 *WUSH...*\n\nTuyul @${contact.id.user} berhasil mencuri *${uang.formatRupiah(stolen)}* dari dompet @${mentions[0].id.user}!`, {
                mentions: [contact.id._serialized, targetId]
            });
        } else {
            // Gagal (Tuyul ditangkap polisi)
            // Cek apakah punya Kartu Bebas Penjara?
            if (inventory['kartu'] > 0) {
                uang.useItem(senderId, 'kartu');
                return msg.reply('🚓 *NEKAD!* Tuyulmu hampir ditangkap polisi, untung punya *Kartu Bebas Penjara*. Kamu selamat, tapi kartu hangus.');
            }

            // Denda
            const denda = 5000;
            uang.kurangSaldo(senderId, denda);
            msg.reply(`🚓 *DITANGKAP!* Aksi tuyulmu gagal. Kamu didenda *${uang.formatRupiah(denda)}* oleh polisi.`);
        }
    }
};