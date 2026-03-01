module.exports = {
    name: 'sambungkata',
    description: 'Game sambung kata Indonesia',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya di grup!');
        if (client.gameStates[chat.id._serialized]) return msg.reply('⚠️ Masih ada game berjalan!');

        const kataAwal = ['makan', 'minum', 'lari', 'tidur', 'buku', 'kertas'][Math.floor(Math.random() * 6)];

        client.gameStates[chat.id._serialized] = {
            type: 'sambungkata',
            lastLetter: kataAwal.slice(-1),
            usedWords: [kataAwal]
        };

        msg.reply(`🔗 *SAMBUNG KATA* 🔗\n\nKata pertama: *${kataAwal.toUpperCase()}*\n👉 Balas dengan kata berawalan huruf: *${kataAwal.slice(-1).toUpperCase()}*\n\n💰 *Rp 500* per kata benar!`);
    }
};