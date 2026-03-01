const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'tebakgambar',
    description: 'Game tebak gambar',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Main di grup biar seru!');
        if (client.gameStates[chat.id._serialized]) return msg.reply('⚠️ Masih ada game berjalan!');

        try {
            msg.reply('⏳ Mengambil gambar...');
            const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json');
            const data = await res.json();
            const soal = data[Math.floor(Math.random() * data.length)];

            client.gameStates[chat.id._serialized] = {
                type: 'tebakgambar',
                jawaban: soal.jawaban.toLowerCase(),
                hadiah: 2500 // Rp 2.500
            };

            const media = await MessageMedia.fromUrl(soal.img, { unsafeMime: true });
            await client.sendMessage(chat.id._serialized, media, { caption: `🖼️ *TEBAK GAMBAR* 🖼️\n\nPetunjuk: "${soal.deskripsi}"\n💰 Hadiah: *Rp 2.500*\n⏳ Waktu: 90 Detik` });

            // Timer
            setTimeout(() => {
                if (client.gameStates[chat.id._serialized] && client.gameStates[chat.id._serialized].type === 'tebakgambar') {
                    client.sendMessage(chat.id._serialized, `⏰ Waktu habis! Jawabannya: *${soal.jawaban}*`);
                    delete client.gameStates[chat.id._serialized];
                }
            }, 90000);

        } catch (e) {
            msg.reply('❌ Gagal mengambil soal.');
        }
    }
};