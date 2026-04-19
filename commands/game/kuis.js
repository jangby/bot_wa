const bankSoal = require('../../data/bankSoal');

module.exports = {
    name: 'kuis',
    description: 'Kuis pengetahuan umum 10 sesi dengan pendaftaran',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Main di grup biar seru!');
        if (client.gameStates[chat.id._serialized]) return msg.reply('⚠️ Masih ada game berjalan di grup ini!');

        // Inisialisasi Lobby Kuis
        client.gameStates[chat.id._serialized] = {
            type: 'kuis_lobby',
            players: [],
            scores: {}, // Untuk mencatat perolehan uang pemain
            questionCount: 0,
            maxQuestions: 10,
            currentJawaban: '',
            currentHadiah: 0
        };

        const aturan = `🧠 *KUIS BERHADIAH (10 SESI)* 🧠\n\n` +
                       `*Aturan Main:*\n` +
                       `1. Pemain wajib daftar dengan ketik *!join kuis*.\n` +
                       `2. Hanya pendaftar yang bisa menjawab.\n` +
                       `3. Ada 10 pertanyaan, yang paling cepat menjawab benar akan dapat saldo.\n` +
                       `4. Hadiah acak *Rp 5.000 - Rp 15.000* per soal.\n\n` +
                       `Silahkan bergabung! Minimal 1 orang untuk memulai.\n` +
                       `Ketik *!start* untuk memulai kuis.`;

        msg.reply(aturan);
    }
};