const uang = require('../../utils/uang'); // Opsional buat format rupiah

module.exports = {
    name: 'patungan',
    description: 'Hitung bagi rata tagihan',
    async execute(client, msg, args) {
        // Format: !patungan [total] [@orang1 @orang2 ...]
        if (args.length < 2) return msg.reply('❌ Format: *!patungan [total] @A @B ...*');

        const total = parseInt(args[0]);
        if (isNaN(total)) return msg.reply('❌ Masukkan nominal angka!');

        const participants = msg.mentionedIds;
        // Tambahkan pengirim juga ke dalam patungan (total orang = yg ditag + pengirim)
        // Jika tidak mau pengirim ikut, hapus baris bawah ini
        const sender = (await msg.getContact()).id._serialized;
        if (!participants.includes(sender)) participants.push(sender);

        const jumlahOrang = participants.length;
        const perOrang = Math.ceil(total / jumlahOrang);

        let text = `💸 *INFO PATUNGAN* 💸\n\n`;
        text += `💰 Total Tagihan: *Rp ${total.toLocaleString('id-ID')}*\n`;
        text += `👥 Jumlah Orang: *${jumlahOrang}*\n`;
        text += `👉 *Per Orang Bayar: Rp ${perOrang.toLocaleString('id-ID')}*\n\n`;
        text += `Daftar Penagihan:\n`;
        
        participants.forEach(p => {
            text += `- @${p.split('@')[0]}\n`;
        });

        msg.reply(text, { mentions: participants });
    }
};