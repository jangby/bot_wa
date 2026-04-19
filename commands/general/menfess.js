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

        // 3. Deteksi Mention / Tag dan pastikan ada pesan
        const mentions = await msg.getMentions();
        
        // Cek apakah ada tag DAN apakah ada argumen setelah tag
        if (mentions.length === 0 || args.length < 2) {
            return msg.reply('❌ Caranya salah!\nFormat: *!menfess @orangnya pesan rahasiamu*\nContoh: *!menfess @628123... semangat ya hari ini*');
        }

        const target = mentions[0];
        const targetId = target.id._serialized;

        // 4. PERBAIKAN: Ekstrak pesan murni yang kebal angka acak
        // args[0] berisi tag-nya. Maka kita ambil kata kedua (args[1]) dan seterusnya lalu gabungkan.
        const pesanRahasia = args.slice(1).join(' ').trim();

        if (!pesanRahasia) {
            return msg.reply('❌ Kamu belum memasukkan pesan rahasianya!');
        }

        try {
            // 5. HAPUS PESAN PENGIRIM SEKARANG JUGA (Hapus Jejak)
            await msg.delete(true);

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