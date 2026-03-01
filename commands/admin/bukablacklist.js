const fs = require('fs');
const path = require('path');

// Pastikan path ini SAMA PERSIS dengan yang ada di blacklist.js
const dbPath = path.join(__dirname, '../../data/blacklist.json');

module.exports = {
    name: 'bukablacklist',
    description: 'Hapus member dari daftar blacklist (Stop hapus chat)',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // 1. Cek Admin
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Fitur khusus Admin!');

        // 2. Ambil Target (ID yang mau dihapus)
        const mentions = await msg.getMentions();
        if (mentions.length === 0) {
            return msg.reply('❌ Tag orang yang mau dibebaskan!\nContoh: *!bukablacklist @budi*');
        }

        const targetContact = mentions[0];
        const targetId = targetContact.id._serialized; // Format: 628xxx@c.us

        // 3. Load Database
        if (!fs.existsSync(dbPath)) {
            return msg.reply('✅ Database blacklist kosong. Tidak ada yang perlu dihapus.');
        }

        let blacklist = [];
        try {
            blacklist = JSON.parse(fs.readFileSync(dbPath));
        } catch (e) {
            return msg.reply('❌ Database rusak. Hubungi owner.');
        }

        // 4. Cek Apakah ID Ada di Database?
        if (!blacklist.includes(targetId)) {
            return msg.reply(`⚠️ User @${targetId.split('@')[0]} TIDAK ADA di daftar blacklist.`, {
                mentions: [targetContact]
            });
        }

        // 5. HAPUS ID DARI LIST (Filter)
        const blacklistBaru = blacklist.filter(id => id !== targetId);

        // 6. SIMPAN PERUBAHAN KE FILE (PENTING!)
        fs.writeFileSync(dbPath, JSON.stringify(blacklistBaru, null, 2));

        // 7. Konfirmasi
        await chat.sendMessage(`✅ *BEBAS!* 🕊️\n\nUser @${targetId.split('@')[0]} telah dihapus dari blacklist.\nChat dia tidak akan dihapus lagi.`, {
            mentions: [targetContact]
        });
    }
};