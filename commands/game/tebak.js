const uang = require('../../utils/uang');

module.exports = {
    name: 'tebak',
    description: 'Tebak angka 1-10 (Judi Halal)',
    async execute(client, msg, args, { contact }) {
        // Format: !tebak [angka] [taruhan]
        if (args.length < 2) return msg.reply('❌ Format: *!tebak [1-10] [nominal]*\nContoh: *!tebak 5 1000*');

        const tebakan = parseInt(args[0]);
        const taruhan = parseInt(args[1]);
        const userId = contact.id._serialized;

        if (isNaN(tebakan) || tebakan < 1 || tebakan > 10) return msg.reply('❌ Pilih angka 1 sampai 10!');
        if (isNaN(taruhan) || taruhan < 100) return msg.reply('❌ Minimal taruhan Rp 100!');

        // Cek Uang
        if (!uang.kurangSaldo(userId, taruhan)) {
            return msg.reply(`💸 Uangmu gak cukup! Saldo: ${uang.formatRupiah(uang.cekSaldo(userId))}`);
        }

        // Kocok Angka
        const angkaMisteri = Math.floor(Math.random() * 10) + 1;
        
        if (tebakan === angkaMisteri) {
            const menang = taruhan * 5; // Menang 5x lipat
            uang.addSaldo(userId, menang);
            msg.reply(`🎉 *JACKPOT!!* Angkanya benar *${angkaMisteri}*!\n\nKamu menang: *${uang.formatRupiah(menang)}*\nSaldo sekarang: ${uang.formatRupiah(uang.cekSaldo(userId))}`);
        } else {
            msg.reply(`📉 *KALAH!* Angka yang keluar: *${angkaMisteri}*.\nUang *${uang.formatRupiah(taruhan)}* hangus.\nSaldo sisa: ${uang.formatRupiah(uang.cekSaldo(userId))}`);
        }
    }
};