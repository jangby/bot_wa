const config = require('../../config.js'); 

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    async execute(client, msg, args) {
        
        // 1. Ambil ID pengirim (Bisa dari author/from)
        const sender = msg.author || msg.from;
        
        // Ambil angkanya saja (Misal: 6285136468097)
        const senderNumber = sender.split('@')[0];

        // 2. Cek apakah nomor tersebut ada di daftar sudoUsers atau ownerNumber
        // Kita gunakan .some() untuk mencocokkan apakah ada nomor di config yang mengandung senderNumber
        const isOwner = config.sudoUsers.some(user => user.includes(senderNumber)) || 
                        config.ownerNumber.includes(senderNumber);

        if (!isOwner) {
            // Jika masih gagal, kita print ke terminal VPS untuk cek ID aslinya
            console.log("ID Pengirim (Gagal Owner):", sender);
            return msg.reply('❌ Fitur ini khusus untuk Owner/Sudo Bot!');
        }

        // 3. Ambil data Mention dan Nominal
        const mentions = await msg.getMentions();
        const target = mentions[0] ? mentions[0].id._serialized : null;
        
        // Mencari angka nominal di argumen
        const nominalStr = args.find(arg => !isNaN(arg) && !arg.includes('@'));
        const nominal = parseInt(nominalStr);

        if (!target || isNaN(nominal)) {
            return msg.reply('⚠️ Format salah!\nContoh: *!addsaldo @nama 1000000*');
        }

        try {
            // 4. Update Database
            // Pastikan objek 'db' sudah di-require atau tersedia secara global
            let saldoSekarang = await db.getSaldo(target) || 0;
            let saldoBaru = saldoSekarang + nominal;

            await db.setSaldo(target, saldoBaru);

            await msg.reply(`✅ *BERHASIL TAMBAH SALDO*\n\nTarget: @${target.split('@')[0]}\nNominal: +Rp${nominal.toLocaleString('id-ID')}\nTotal Saldo: Rp${saldoBaru.toLocaleString('id-ID')}`, {
                mentions: [target]
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('AddSaldo Error:', error);
            msg.reply('❌ Terjadi kesalahan pada database saldo.');
        }
    }
};