const bankSoal = require('../../data/bankSoal');

module.exports = {
    name: 'kuis',
    description: 'Kuis pengetahuan umum berhadiah',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Main di grup biar seru!');
        if (client.gameStates[chat.id._serialized]) return msg.reply('⚠️ Masih ada game berjalan di grup ini!');

        const soal = bankSoal[Math.floor(Math.random() * bankSoal.length)];
        
        client.gameStates[chat.id._serialized] = {
            type: 'kuis',
            jawaban: soal.jawaban.toLowerCase(),
            hadiah: 2000 // Rp 2.000
        };

        msg.reply(`🧠 *KUIS BERHADIAH* 🧠\n\n${soal.soal}\n\n💰 Hadiah: *Rp 2.000*\n⏳ Waktu: 60 Detik`);

        // Timer Habis
        setTimeout(() => {
            if (client.gameStates[chat.id._serialized] && client.gameStates[chat.id._serialized].type === 'kuis') {
                client.sendMessage(chat.id._serialized, `⏰ Waktu habis! Jawabannya: *${soal.jawaban}*`);
                delete client.gameStates[chat.id._serialized];
            }
        }, 60000);
    }
};