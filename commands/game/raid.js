const uang = require('../../utils/uang');
const levelSystem = require('../../utils/level');
const printer = require('../../utils/printer');

// Helper Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    name: 'raid',
    description: 'Lobby Raid Boss (Butuh 4 Orang)',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Raid hanya bisa di grup!');

        // Cek Game Lain
        if (!client.gameStates) client.gameStates = {};
        if (client.gameStates[msg.from]) {
            return msg.reply('⚠️ Masih ada game berjalan di grup ini.');
        }

        // INIT LOBBY
        client.gameStates[msg.from] = {
            type: 'raid_lobby',
            players: [],
            maxPlayers: 4, // Bisa diubah
            started: false
        };
        
        // Auto Join Pembuat Lobby
        const creatorId = msg.author || msg.from;
        client.gameStates[msg.from].players.push(creatorId);

        await msg.reply(`🏰 *RAID BOSS LOBBY DIBUKA!* 🏰
        
Misi: Mengalahkan *Naga Ijo* (HP: 5000)
Hadiah: Rp 50.000 + 500 XP

👥 Pemain: 1/4
1. @${creatorId.split('@')[0]}

👉 Ketik *!join* untuk bergabung!
👉 Ketik *!start* jika sudah penuh.`, {
            mentions: [creatorId]
        });
    }
};