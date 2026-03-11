module.exports = {
    name: 'hidetag',
    description: 'Mention semua anggota grup tanpa tag biru',
    async execute(client, msg, args) {
        try {
            // 1. Ambil data Chat
            const chat = await msg.getChat();
            
            // Cek apakah di grup
            if (!chat.isGroup) {
                return msg.reply('❌ Fitur ini hanya untuk di dalam grup!');
            }

            // 2. Ambil isi pesan (dari teks atau reply)
            let hidetagMsg = args.join(' ');
            if (!hidetagMsg && msg.hasQuotedMsg) {
                const quoted = await msg.getQuotedMessage();
                hidetagMsg = quoted.body;
            }

            if (!hidetagMsg) {
                return msg.reply('⚠️ Masukkan pesan! Contoh: *!hidetag P*');
            }

            // 3. Ambil semua ID peserta secara aman
            // Kita gunakan map untuk langsung mengambil ID-nya saja
            const mentions = chat.participants.map(p => p.id._serialized);

            // 4. Kirim pesan
            // Gunakan mentions: mentions agar notifikasi masuk ke semua member
            await client.sendMessage(msg.from, hidetagMsg, { 
                mentions: mentions 
            });

            // Reaksi sukses
            await msg.react('✅');

        } catch (error) {
            console.error('Hidetag Error:', error);
            // Memberikan detail error agar kamu tahu letak salahnya
            msg.reply(`❌ Gagal hidetag.\n*Pesan:* ${error.message}`);
        }
    }
};