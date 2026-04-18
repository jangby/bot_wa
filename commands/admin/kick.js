module.exports = {
    name: 'kick',
    description: 'Mengeluarkan member dari grup (dengan tag atau reply)',
    type: 'admin',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // 1. Validasi Keamanan: Pastikan digunakan di Grup
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
        }

        // 2. Validasi Keamanan: Pastikan pengirim adalah Admin Grup atau Owner
        if (!isAdmin && !isOwner) {
            return msg.reply('⛔ *AKSES DITOLAK* ⛔\nPerintah ini khusus untuk Admin Grup!');
        }

        // 3. Pastikan Bot adalah Admin Grup (agar punya hak untuk mengeluarkan member)
        const botId = client.info.wid._serialized;
        const botPart = chat.participants.find(p => p.id._serialized === botId);
        const isBotAdmin = botPart && (botPart.isAdmin || botPart.isSuperAdmin);

        if (!isBotAdmin) {
            return msg.reply('❌ Bot tidak bisa mengeluarkan member karena bot belum dijadikan Admin di grup ini!');
        }

        let targetId = null;

        // 4. DETEKSI TARGET 1: Cek apakah user me-reply pesan orang yang mau di-kick
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            // Ambil ID pembuat pesan asli (author untuk grup)
            targetId = quotedMsg.author || quotedMsg.from; 
        } 
        // 5. DETEKSI TARGET 2: Cek apakah user men-tag/mention orangnya langsung
        else if (msg.mentionedIds && msg.mentionedIds.length > 0) {
            targetId = msg.mentionedIds[0];
        }

        // Jika bot tidak menemukan target dari reply maupun tag
        if (!targetId) {
            return msg.reply('❌ Caranya salah!\nSilakan balas (reply) pesan orang yang ingin di-kick dengan perintah *!kick*, atau ketik *!kick @orangnya*.');
        }

        // 6. Proteksi Ekstra: Mencegah senjata makan tuan
        if (targetId === botId) {
            return msg.reply('❌ Aku tidak bisa mengeluarkan diriku sendiri dari grup!');
        }
        
        // Proteksi agar Owner tidak bisa di-kick oleh Admin biasa
        const config = require('../../config');
        if (targetId === config.ownerNumber || config.sudoUsers.includes(targetId)) {
            return msg.reply('❌ Akses ditolak! Kamu tidak bisa mengeluarkan Developer/Owner bot.');
        }

        try {
            // Beri reaksi proses
            await msg.react('⏳');

            // Proses tendang member dari grup
            await chat.removeParticipants([targetId]);
            
            // Konfirmasi sukses
            await msg.react('✅');
            await msg.reply('👞 *EKSEKUSI SUKSES*\nMember tersebut telah berhasil dikeluarkan dari grup.');

        } catch (error) {
            console.error('Error saat kick member:', error);
            msg.reply('❌ Gagal mengeluarkan member. Pastikan formatnya benar dan bot memiliki hak akses.');
        }
    }
};