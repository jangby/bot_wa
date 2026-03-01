const uang = require('../../utils/uang');

module.exports = {
    name: 'petir',
    description: 'Bakar uang teman (Butuh Item Petir)',
    async execute(client, msg, args, { contact, chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa di grup!');

        // 1. Cek Item Petir
        const senderId = contact.id._serialized;
        if (!uang.useItem(senderId, 'petir')) {
            return msg.reply('❌ Kamu gak punya *Petir*! Beli dulu di *!toko*.');
        }

        // 2. Ambil Target (FIX ID LID)
        const mentions = await msg.getMentions();
        if (mentions.length === 0) return msg.reply('❌ Siapa yang mau disambar? Tag orangnya!');

        const targetId = mentions[0].id._serialized; // Pasti dapat @c.us (Nomor HP)

        // Validasi
        if (targetId === senderId) return msg.reply('⚡ Kamu menyambar diri sendiri... Tolol.');
        
        // 3. Cek Saldo Target
        const targetSaldo = uang.cekSaldo(targetId);
        
        // Batas minimal target harus punya uang (Misal 10.000)
        if (targetSaldo < 10000) {
            // Refund item karena gagal
            uang.addItem(senderId, 'petir', 1);
            return msg.reply('⚡ Langit mendung... tapi target terlalu miskin. Petir gak tega nyambar gembel. (Item dikembalikan)');
        }

        // 4. Eksekusi Pembakaran
        // Bakar 10% - 30% dari uang target
        const persentase = Math.floor(Math.random() * 21) + 10; // 10-30
        const burnAmount = Math.floor(targetSaldo * (persentase / 100));

        uang.kurangSaldo(targetId, burnAmount);

        // Visual
        await chat.sendMessage(`⚡ *DUARRRR!!* ⚡\n\n@${contact.id.user} mengirim petir ke @${mentions[0].id.user}!\n🔥 Uang hangus: *${uang.formatRupiah(burnAmount)}* (${persentase}%)\n💸 Sisa saldo korban: ${uang.formatRupiah(targetSaldo - burnAmount)}`, {
            mentions: [contact.id._serialized, targetId]
        });
    }
};