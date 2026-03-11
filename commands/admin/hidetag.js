module.exports = {
    name: 'hidetag',
    description: 'Mention semua anggota grup tanpa terlihat deretan tagnya',
    async execute(client, msg, args) {
        // 1. Cek apakah ini di dalam grup
        const chat = await msg.getChat();
        if (!chat.isGroup) {
            return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam grup!');
        }

        // 2. Cek apakah yang menggunakan fitur ini adalah Admin
        // (Opsional: Hapus blok ini jika ingin member biasa bisa hidetag)
        const authorId = msg.author || msg.from;
        const user = chat.participants.find(p => p.id._serialized === authorId);
        if (!user.isAdmin && !user.isSuperAdmin) {
            return msg.reply('❌ Hanya Admin grup yang bisa menggunakan hidetag!');
        }

        // 3. Ambil pesan yang ingin di-hidetag
        let hidetagMsg = args.join(' ');
        
        // Jika tidak ada teks setelah !hidetag, tapi user membalas (reply) sebuah pesan
        if (!hidetagMsg && msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            hidetagMsg = quoted.body;
        }

        if (!hidetagMsg) {
            return msg.reply('⚠️ Masukkan pesan yang ingin di-hidetag!\nContoh: *!hidetag Assalamualaikum semua*');
        }

        // 4. Ambil semua ID peserta grup
        const participants = chat.participants;
        const mentions = [];

        for (let participant of participants) {
            // Kita masukkan semua ID ke dalam array mentions
            mentions.push(participant.id._serialized);
        }

        // 5. Kirim pesan dengan mentions tersembunyi
        // Mentions diletakkan di parameter, tapi tidak ditulis di body teks
        await client.sendMessage(msg.from, hidetagMsg, { 
            mentions: mentions 
        });

        // Beri reaksi sukses
        await msg.react('✅');
    }
};