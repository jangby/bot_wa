const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'antilink',
    description: 'Menyalakan/mematikan fitur Anti-Link grup WhatsApp',
    type: 'admin',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // 1. Validasi
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
        }
        if (!isAdmin && !isOwner) {
            return msg.reply('⛔ *AKSES DITOLAK*\nPerintah ini khusus untuk Admin Grup!');
        }
        if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {
            return msg.reply('❌ Format salah!\nKetik: *!antilink on* atau *!antilink off*');
        }

        // 2. Baca Database Anti-Link
        const antilinkPath = path.join(__dirname, '../../data/antilink.json');
        let antilinkData = [];
        
        if (fs.existsSync(antilinkPath)) {
            antilinkData = JSON.parse(fs.readFileSync(antilinkPath));
        } else {
            fs.writeFileSync(antilinkPath, JSON.stringify([]));
        }

        const groupId = chat.id._serialized;
        const action = args[0].toLowerCase();

        // 3. Eksekusi Perintah
        try {
            await msg.react('⏳');

            if (action === 'on') {
                if (antilinkData.includes(groupId)) {
                    await msg.react('⚠️');
                    return msg.reply('Fitur Anti-Link sudah aktif di grup ini.');
                }
                
                antilinkData.push(groupId);
                fs.writeFileSync(antilinkPath, JSON.stringify(antilinkData, null, 2));
                
                await msg.react('✅');
                return msg.reply('🛡️ *ANTI-LINK AKTIF*\nBot akan otomatis menghapus pesan dari member biasa yang mengirim link grup WhatsApp lain.');
                
            } else if (action === 'off') {
                if (!antilinkData.includes(groupId)) {
                    await msg.react('⚠️');
                    return msg.reply('Fitur Anti-Link memang belum aktif di grup ini.');
                }
                
                antilinkData = antilinkData.filter(id => id !== groupId);
                fs.writeFileSync(antilinkPath, JSON.stringify(antilinkData, null, 2));
                
                await msg.react('✅');
                return msg.reply('🔓 *ANTI-LINK NONAKTIF*\nMember bebas membagikan link grup.');
            }
            
        } catch (error) {
            console.error('Error setting antilink:', error);
            msg.reply('❌ Terjadi kesalahan saat mengatur Anti-Link.');
        }
    }
};