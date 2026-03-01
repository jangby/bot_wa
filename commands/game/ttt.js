module.exports = {
    name: 'ttt',
    description: 'Main Tic Tac Toe VS Teman',
    async execute(client, msg, args, { chat, contact }) {
        if (!chat.isGroup) return msg.reply('❌ Hanya bisa main di grup!');

        // Ambil Lawan (Fix ID LID)
        const mentions = await msg.getMentions();
        if (mentions.length === 0) return msg.reply('❌ Tag lawannya! Contoh: *!ttt @budi*');

        const opponentId = mentions[0].id._serialized;
        const challengerId = contact.id._serialized;

        if (opponentId === challengerId) return msg.reply('❌ Gak bisa main sama diri sendiri.');

        // Cek Game Lain
        if (!client.gameStates) client.gameStates = {};
        if (client.gameStates[msg.from]) {
            return msg.reply('⚠️ Masih ada game berjalan di grup ini. Selesaikan dulu!');
        }

        // Inisialisasi Game
        client.gameStates[msg.from] = {
            type: 'ttt',
            playerX: challengerId, // Penantang = X
            playerO: opponentId,   // Lawan = O
            turn: 'X',             // Giliran awal X
            board: ['1','2','3','4','5','6','7','8','9'], // Papan kosong
            moves: 0
        };

        const text = `❌ *TIC TAC TOE* ⭕\n\n` +
                     `@${challengerId.split('@')[0]} (X)  VS  @${opponentId.split('@')[0]} (O)\n\n` +
                     `Giliran: *X* (@${challengerId.split('@')[0]})\n` +
                     `Ketik angka *1-9* untuk mengisi papan.\n\n` +
                     `\`\`\` 1 | 2 | 3 \n---+---+---\n 4 | 5 | 6 \n---+---+---\n 7 | 8 | 9 \`\`\``;

        await chat.sendMessage(text, { mentions: [challengerId, opponentId] });
    }
};