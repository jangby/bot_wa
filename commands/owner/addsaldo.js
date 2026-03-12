const config = require('../../config.js'); 
const uang = require('../../utils/uang.js'); 

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    // Tangkap contact dan isOwner bawaan dari index.js
    async execute(client, msg, args, { contact, isOwner: isOwnerGlobal }) { 
        
        // 1. Ambil ID pengirim
        const senderRaw = msg.author || msg.from;
        
        // Bersihkan ID
        const senderNumber = senderRaw.split('@')[0].split(':')[0];

        // Cocokkan dengan config.js
        const isOwnerLocal = config.ownerNumber.includes(senderNumber) || 
                             config.sudoUsers.some(user => user.includes(senderNumber));

        // 🔥 LOGGING DEBUGGING UNTUK MELIHAT MASALAH ASLINYA 🔥
        console.log('\n--- 🐞 DEBUGGING FITUR ADDSALDO 🐞 ---');
        console.log('1. msg.author (Pengirim Mentah) :', msg.author);
        console.log('2. msg.from (Sumber Chat)       :', msg.from);
        console.log('3. contact ID (Dari index.js)   :', contact ? contact.id._serialized : 'Tidak terbaca');
        console.log('4. Nomor Bersih (Telah difilter):', senderNumber);
        console.log('5. Status Owner (Dari index.js) :', isOwnerGlobal);
        console.log('6. Status Owner (Filter Lokal)  :', isOwnerLocal);
        console.log('--------------------------------------\n');

        if (!isOwnerLocal && !isOwnerGlobal) {
            return msg.reply('❌ Fitur ini khusus untuk Owner/Sudo Bot!\n\n*(Log detail sudah dicetak ke terminal)*');
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