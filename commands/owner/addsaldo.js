const uang = require('../../utils/uang.js'); 

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    // Kita panggil parameter isOwner dari index.js yang sudah terbukti akurat
    async execute(client, msg, args, { isOwner }) { 
        
        // 1. Cek otorisasi murni dari index.js
        if (!isOwner) {
            return msg.reply('❌ Fitur ini khusus untuk Owner/Sudo Bot!');
        }

        // 2. Ambil data Mention (Pastikan mengambil Objek Kontak-nya)
        const mentionsArray = await msg.getMentions();
        const targetContact = mentionsArray[0]; // Ini Objek Kontak
        const targetId = targetContact ? targetContact.id._serialized : null; // Ini String ID
        
        // 3. Ambil angka nominal di argumen
        const nominalStr = args.find(arg => !isNaN(arg) && !arg.includes('@'));
        const nominal = parseInt(nominalStr);

        if (!targetId || isNaN(nominal)) {
            return msg.reply('⚠️ Format salah!\nContoh: *!addsaldo @nama 1000000*');
        }

        try {
            // 4. Update Database
            const saldoBaru = uang.addSaldo(targetId, nominal, 'Topup via Owner Command');

            // Membersihkan ID target untuk tampilan pesan
            const cleanTarget = targetId.split('@')[0].split(':')[0];

            // 🔥 PERBAIKAN BUG TYPERROR CRASH 🔥
            // Mentions sekarang diisi dengan array object 'targetContact', bukan string 'targetId'
            await msg.reply(`✅ *BERHASIL TAMBAH SALDO*\n\nTarget: @${cleanTarget}\nNominal: +Rp${nominal.toLocaleString('id-ID')}\nTotal Saldo: Rp${saldoBaru.toLocaleString('id-ID')}`, undefined, {
                mentions: [targetContact] 
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('AddSaldo Error:', error);
            msg.reply('❌ Terjadi kesalahan pada database atau sistem balasan.');
        }
    }
};