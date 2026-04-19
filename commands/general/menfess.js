module.exports = {
    name: 'menfess',
    description: 'Kirim pesan rahasia (anonim) ke seseorang via tag',
    type: 'general',
    async execute(client, msg, args, { chat }) {
        
        // 1. Pastikan digunakan di dalam grup (karena butuh fitur tag/mention)
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
        }

        // 2. Cek apakah Bot adalah Admin (Wajib untuk bisa hapus pesan orang lain)
        const botId = client.info.wid._serialized;
        const botPart = chat.participants.find(p => p.id._serialized === botId);
        const isBotAdmin = botPart && (botPart.isAdmin || botPart.isSuperAdmin);

        if (!isBotAdmin) {
            return msg.reply('❌ Bot harus dijadikan Admin Grup terlebih dahulu agar bisa menghapus pesan rahasiamu (biar gak ketahuan)!');
        }

        // 3. Deteksi Mention / Tag
        const mentions = await msg.getMentions();
        if (mentions.length === 0) {
            return msg.reply('❌ Caranya salah!\nFormat: *!menfess @orangnya pesan rahasiamu*\nContoh: *!menfess @628123456789 Halo aku mengagumimu dari jauh*');
        }

        const target = mentions[0];
        const targetId = target.id._serialized;

        // 4. Ekstrak pesan (Buang kata "!menfess" dan tag nomornya)
        let pesanRahasia = msg.body;
        // Hapus command-nya
        pesanRahasia = pesanRahasia.replace(/!menfess/i, '');
        // Hapus tag-nya (bisa berupa @nomor)
        pesanRahasia = pesanRahasia.replace(`@${target.number}`, '');
        // Bersihkan sisa spasi di awal/akhir
        pesanRahasia = pesanRahasia.trim();

        if (!pesanRahasia) {
            return msg.reply('❌ Kamu belum memasukkan pesan rahasianya!\nContoh: *!menfess @orangnya semangat ya hari ini*');
        }

        try {
            // 5. HAPUS PESAN PENGIRIM AGAR ANONIM
            await msg.delete(true);

            // 6. Kirim Menfess di grup secara Anonim
            const menfessText = `💌 *MENFESS RAHASIA* 💌\n\nUntuk: @${target.number}\nDari: _Seseorang yang rahasia_ 🤫\n\nPesan:\n_"${pesanRahasia}"_`;
            
            await chat.sendMessage(menfessText, { mentions: [targetId] });

            /* // OPSI TAMBAHAN: Jika kamu ingin bot mengirimkannya via JAPRI/PC ke orang tersebut (bukan di grup), 
            // hapus kode `await chat.sendMessage(...)` di atas, lalu hilangkan tanda komentar pada kode di bawah ini:
            //
            // await client.sendMessage(targetId, `💌 *MENFESS RAHASIA DARI GRUP ${chat.name}* 💌\n\nSeseorang mengirimimu pesan rahasia:\n\n_"${pesanRahasia}"_`);
            */

        } catch (error) {
            console.error('Error saat kirim menfess:', error);
            // Coba kirim pesan error ke pembuat pesan jika memungkinkan
            try {
                const contact = await msg.getContact();
                await client.sendMessage(contact.id._serialized, '❌ Gagal mengirim menfess. Pastikan bot adalah Admin grup untuk menghapus pesanmu.');
            } catch (e) {}
        }
    }
};