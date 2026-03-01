const uang = require('../../utils/uang');

module.exports = {
    name: 'bukakotak',
    description: 'Buka Kotak Misteri',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        if (!uang.useItem(userId, 'kotak')) return msg.reply('❌ Beli *Kotak* dulu di toko!');

        const roll = Math.random();
        let hadiah = 0;
        let pesan = '';

        if (roll < 0.4) { // 40% Zonk
            hadiah = 100; // Kasih receh dikit
            pesan = '📦 Isinya cuma debu... (Rp 100)';
        } else if (roll < 0.8) { // 40% Menengah (Rp 5k - 20k)
            hadiah = Math.floor(Math.random() * 15000) + 5000;
            pesan = `📦 Lumayan! Isinya uang *${uang.formatRupiah(hadiah)}*`;
        } else { // 20% Jackpot (Rp 50k - 100k)
            hadiah = Math.floor(Math.random() * 50000) + 50000;
            pesan = `📦 *JACKPOT!!!* Isinya Emas Batangan seharga *${uang.formatRupiah(hadiah)}* 🎉`;
        }

        uang.addSaldo(userId, hadiah);
        msg.reply(pesan);
    }
};