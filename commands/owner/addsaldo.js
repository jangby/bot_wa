const config = require('../../config.js'); 
const uang = require('../../utils/uang.js'); // Menggunakan utils uang yang benar

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    async execute(client, msg, args) { 
        
        // 1. Ambil ID pengirim
        const senderRaw = msg.author || msg.from;
        
        // 🔥 PERBAIKAN BUG WHATSAPP MULTI-DEVICE
        // Jika ID berupa "62851...:2@c.us", kita buang ":2" dan "@c.us" agar murni jadi "62851..."
        const senderNumber = senderRaw.split('@')[0].split(':')[0];

        // 2. Cocokkan dengan config.js (menggunakan nomor murni)
        const isOwner = config.ownerNumber.includes(senderNumber) || 
                        config.sudoUsers.some(user => user.includes(senderNumber));

        if (!isOwner) {
            console.log(`[Akses Ditolak] Nomor terbaca: ${senderNumber}`);
            return msg.reply('❌ Fitur ini khusus untuk Owner/Sudo Bot!');
        }

        // 3. Ambil data Mention dan Nominal
        const mentions = await msg.getMentions();
        const target = mentions[0] ? mentions[0].id._serialized : null;
        
        const nominalStr = args.find(arg => !isNaN(arg) && !arg.includes('@'));
        const nominal = parseInt(nominalStr);

        if (!target || isNaN(nominal)) {
            return msg.reply('⚠️ Format salah!\nContoh: *!addsaldo @nama 1000000*');
        }

        try {
            // 4. Update Database
            const saldoBaru = uang.addSaldo(target, nominal, 'Topup via Owner Command');

            // Membersihkan target ID saat disebut di pesan balasan
            const cleanTarget = target.split('@')[0].split(':')[0];

            await msg.reply(`✅ *BERHASIL TAMBAH SALDO*\n\nTarget: @${cleanTarget}\nNominal: +Rp${nominal.toLocaleString('id-ID')}\nTotal Saldo: Rp${saldoBaru.toLocaleString('id-ID')}`, {
                mentions: [target]
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('AddSaldo Error:', error);
            msg.reply('❌ Terjadi kesalahan pada database saldo.');
        }
    }
};