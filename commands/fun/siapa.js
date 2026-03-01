module.exports = {
    name: 'siapa',
    description: 'Menunjuk anggota grup secara acak',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya untuk grup!');
        
        const pertanyaan = args.join(' ');
        if (!pertanyaan) return msg.reply('❌ Tanyanya apa? Contoh: *!siapa yang paling ganteng?*');

        // Ambil peserta
        const participants = chat.participants;
        
        // Pilih acak
        const randomUser = participants[Math.floor(Math.random() * participants.length)];
        
        // AMAN: Kita paksa ID menjadi String agar tidak error "t.replace"
        const targetId = String(randomUser.id._serialized);

        // Kirim pesan dengan mention
        await chat.sendMessage(`🤔 *Pertanyaan:* ${pertanyaan}\n👉 *Jawabannya:* @${randomUser.id.user}`, {
            mentions: [targetId]
        });
    }
};