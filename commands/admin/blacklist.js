const fs = require('fs');
const path = require('path');
const config = require('../../config'); // PENTING: Import config buat cek nomor Owner

// Path Database Blacklist
const dbPath = path.join(__dirname, '../../data/blacklist.json');

module.exports = {
    name: 'blacklist',
    description: 'Bungkam member (Auto-Delete Chat)',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // 1. Cek Admin
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Fitur khusus Admin!');

        // 2. Ambil Target
        const mentions = await msg.getMentions();
        if (mentions.length === 0) {
            return msg.reply('❌ Tag orang yang mau di-blacklist (bungkam)!\nContoh: *!blacklist @budi*');
        }

        const targetContact = mentions[0];
        const targetId = targetContact.id._serialized; 

        // ==========================================
        // 🛡️ FITUR ANTI-KUDETA (PROTEKSI OWNER)
        // ==========================================
        
        // Cek 1: Jangan blacklist Bot Sendiri
        if (targetContact.isMe) {
            return msg.reply('❌ Saya tidak bisa mem-blacklist diri sendiri.');
        }

        // Cek 2: Jangan blacklist Owner (Ambil dari config.js)
        if (targetId === config.ownerNumber) {
            return msg.reply('❌ *BERANI MATI YA?* 😡\nOwner tidak bisa di-blacklist oleh siapapun!');
        }

        // Opsional: Jika kamu punya Sudo Users (Owner ke-2 dst), cek juga disini
        if (config.sudoUsers && config.sudoUsers.includes(targetId)) {
             return msg.reply('❌ *DILARANG!* Target adalah Sudo User (VIP).');
        }

        // ==========================================

        // 3. Load Database
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '[]');
        let blacklist = JSON.parse(fs.readFileSync(dbPath));

        // 4. Cek Apakah Sudah Ada?
        if (blacklist.includes(targetId)) {
            return msg.reply('⚠️ Orang ini sudah ada di daftar Blacklist (Sedang dibungkam).');
        }

        // 5. Tambahkan ke Database
        blacklist.push(targetId);
        fs.writeFileSync(dbPath, JSON.stringify(blacklist, null, 2));

        // 6. Konfirmasi
        await chat.sendMessage(`⛔ *BLACKLIST AKTIF* ⛔\n\nUser @${targetId.split('@')[0]} sekarang masuk daftar hitam.\nSetiap chat yang dia kirim akan *Dihapus Otomatis* oleh bot.`, {
            mentions: [targetContact] 
        });
    }
};