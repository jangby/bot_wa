module.exports = {
    name: 'menfess',
    description: 'Kirim pesan rahasia (anonim) ke seseorang via tag dengan jeda aman',
    type: 'general',
    async execute(client, msg, args, { chat }) {
        
        // 1. Pastikan digunakan di dalam grup
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
        }

        // 2. Cek apakah Bot adalah Admin (Wajib untuk menghapus pesan)
        const botId = client.info.wid._serialized;
        const botPart = chat.participants.find(p => p.id._serialized === botId);
        const isBotAdmin = botPart && (botPart.isAdmin || botPart.isSuperAdmin);

        if (!isBotAdmin) {
            return msg.reply('❌ Bot harus dijadikan Admin Grup terlebih dahulu agar bisa menghapus pesan rahasiamu!');
        }

        // 3. Deteksi Mention / Tag
        const mentions = await msg.getMentions();
        if (mentions.length === 0) {
            return msg.reply('❌ Caranya salah!\nFormat: *!menfess @orangnya pesan rahasiamu*');
        }

        const target = mentions[0];
        const targetId = target.id._serialized;

        // 4. Ekstrak pesan murni
        let pesanRahasia = msg.body;
        pesanRahasia = pesanRahasia.replace(/!menfess/i, '');
        pesanRahasia = pesanRahasia.replace(`@${target.number}`, '');
        pesanRahasia = pesanRahasia.trim();

        if (!pesanRahasia) {
            return msg.reply('❌ Kamu belum memasukkan pesan rahasianya!');
        }

        try {
            // 5. HAPUS PESAN PENGIRIM SEKARANG JUGA (Hapus Jejak)
            await msg.delete(true);

            // Fitur notifikasi JAPRI dihapus untuk menghindari banned dari pihak Meta/WhatsApp.
            // Bot akan bekerja murni di latar belakang (silently).

            // 6. PASANG TIMER 5 MENIT (300.000 milidetik)
            const waktuJeda = 5 * 60 * 1000; 
            
            setTimeout(async () => {
                try {
                    // Eksekusi pengiriman pesan di grup setelah 5 menit
                    const menfessText = `💌 *MENFESS RAHASIA* 💌\n\nUntuk: @${target.number}\nDari: _Seseorang yang rahasia_ 🤫\n\nPesan:\n_"${pesanRahasia}"_`;
                    
                    await chat.sendMessage(menfessText, { mentions: [targetId] });
                } catch (err) {
                    console.error('Gagal mengirim menfess setelah timer selesai:', err);
                }
            }, waktuJeda);

        } catch (error) {
            console.error('Error saat kirim menfess:', error);
        }
    }
};