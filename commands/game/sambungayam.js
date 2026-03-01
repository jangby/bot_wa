const uang = require('../../utils/uang');

module.exports = {
    name: 'sambungayam',
    description: 'Adu ayam dengan teman (Judi)',
    async execute(client, msg, args, { chat, contact }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa main di grup!');

        // Cek input
        if (args.length < 2) {
            return msg.reply('❌ Format salah!\nKetik: *!sambungayam @lawan [taruhan]*\nContoh: *!sambungayam @budi 5000*');
        }

        const mentions = await msg.getMentions();
        if (mentions.length === 0) {
            return msg.reply('❌ Kamu harus tag lawan yang mau diajak main!');
        }

        const opponentId = mentions[0].id._serialized; 
        const challengerId = contact.id._serialized;
        
        if (!opponentId.includes('@c.us')) {
            return msg.reply('❌ Gagal mengambil ID lawan. Pastikan lawan ada di kontak/grup.');
        }

        if (opponentId === challengerId) return msg.reply('❌ Gak bisa adu ayam sama diri sendiri, stres ya?');

        const bet = parseInt(args[args.length - 1]); 
        if (isNaN(bet) || bet <= 0) return msg.reply('❌ Masukkan jumlah taruhan yang valid!');

        // Cek Saldo Penantang
        if (uang.cekSaldo(challengerId) < bet) {
            return msg.reply(`💸 Uangmu kurang bos! Sisa saldo: ${uang.formatRupiah(uang.cekSaldo(challengerId))}`);
        }

        // Cek Game Aktif
        if (!client.gameStates) client.gameStates = {};
        if (client.gameStates[msg.from]) {
            return msg.reply('⚠️ Masih ada game berjalan di grup ini. Selesaikan dulu!');
        }

        // 🔥 LOGIKA BARU: POTONG SALDO PENANTANG DI DEPAN (ESCROW) 🔥
        // Agar tidak curang (uang dipakai belanja saat nunggu lawan)
        uang.kurangSaldo(challengerId, bet);

        // Simpan State Game
        client.gameStates[msg.from] = {
            type: 'sambungayam',
            challenger: challengerId,
            opponent: opponentId,
            bet: bet,
            timestamp: Date.now()
        };

        const text = `🥊 *SAMBUNG AYAM* 🥊\n\n` +
                     `@${challengerId.split('@')[0]} menantang @${opponentId.split('@')[0]}!\n` +
                     `💰 Taruhan: *${uang.formatRupiah(bet)}*\n` +
                     `_Saldo penantang sudah ditahan bot._\n\n` +
                     `👉 Lawan ketik *!gas* untuk terima\n` +
                     `👉 Penantang ketik *!batal* untuk batal (Uang kembali)`;

        await chat.sendMessage(text, {
            mentions: [challengerId, opponentId]
        });
    }
};