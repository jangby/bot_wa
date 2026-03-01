const premiumHandler = require('../../utils/premiumHandler');
const uang = require('../../utils/uang');

module.exports = {
    name: 'premium',
    description: 'Beli akses premium atau atur harga (Owner)',
    async execute(client, msg, args, { isOwner, contact }) {
        
        // 1. INFO / BANTUAN
        if (args.length === 0) {
            return msg.reply(`👑 *MENU PREMIUM* 👑

*Untuk User (Beli):*
Ketik: *!premium [nama_fitur]*
Contoh: *!premium steks* (Beli akses fitur steks)

*Untuk Owner (Setting):*
Ketik: *!premium [fitur] [limit_harian] [harga]*
Contoh: *!premium steks 5 5000*
(Artinya: Gratisan cuma bisa 5x sehari. Kalau mau unlimited, bayar 5000/hari)`);
        }

        const commandName = args[0].toLowerCase();

        // 2. MODE OWNER: SETTING HARGA
        if (isOwner && args.length >= 3) {
            const limit = args[1];
            const price = args[2];

            // Validasi Angka
            if (isNaN(limit) || isNaN(price)) {
                return msg.reply('❌ Limit dan Harga harus berupa angka!');
            }

            // Cek apakah command ada?
            if (!client.commands.has(commandName)) {
                return msg.reply(`⚠️ Perintah *!${commandName}* tidak ditemukan di bot ini.`);
            }

            // Simpan Config
            premiumHandler.setConfig(commandName, limit, price);
            
            return msg.reply(`✅ *SETTING TERSIMPAN*\n\nFitur: *!${commandName}*\nGratis: *${limit}x / hari*\nHarga Premium: *${uang.formatRupiah(price)} / hari*`);
        }

        // 3. MODE USER: BELI PREMIUM
        // User mengetik: !premium steks (misalnya)
        const userId = contact.id._serialized;
        
        // Cek apakah command valid (opsional, biar user gak asal ketik)
        if (!client.commands.has(commandName) && commandName !== 'all') {
             // Kalau mau beli global premium tanpa fitur spesifik, user bisa ketik !premium all (opsional)
        }

        const result = premiumHandler.buyPremium(userId, commandName);
        
        // Kirim balasan hasil pembelian
        return msg.reply(result.msg);
    }
};