const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'buka',
    description: 'Buka media sekali lihat (View Once) secara manual',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        // 1. Cek Admin/Owner
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Fitur ini khusus Admin & Owner!');

        // 2. Cek Reply
        if (!msg.hasQuotedMsg) {
            return msg.reply('❌ Caranya: Reply (balas) foto/video sekali lihat, lalu ketik *!buka*');
        }

        try {
            const quotedMsg = await msg.getQuotedMessage();

            // Beri reaksi proses (biar user tau bot sedang bekerja)
            await msg.react('⏳');

            // --- METODE PAKSA (BRUTE FORCE) ---
            // Kita tidak cek if(hasMedia) lagi, langsung coba download aja.
            // Kalau gagal download, berarti emang bukan media.
            
            const media = await quotedMsg.downloadMedia();

            // Cek apakah hasil download valid?
            if (!media || !media.data) {
                await msg.react('❌');
                return msg.reply('❌ Gagal mengambil media. Pastikan yang direply adalah Foto/Video (bukan stiker/teks) dan belum kadaluarsa.');
            }

            // Kirim Ulang
            await client.sendMessage(msg.from, media, { 
                caption: '🔓 *MEDIA TERBUKA*\n\nBerhasil dibuka oleh Admin.',
                isViewOnce: false // Pastikan false agar tidak view once lagi
            });

            await msg.react('✅');

        } catch (error) {
            console.error('Error !buka:', error);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan. Bot tidak bisa mendownload media tersebut (Mungkin bug library atau WA memblokir aksesnya).');
        }
    }
};