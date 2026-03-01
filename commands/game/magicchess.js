const mcData = require('../../data/mcData');
const uang = require('../../utils/uang');

// Helper Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    name: 'mc',
    description: 'Main Magic Chess Lite (Beta)',
    async execute(client, msg, args, { chat, contact }) {
        if (!chat.isGroup) return msg.reply('❌ Main di grup bos!');
        
        const senderId = contact.id._serialized;
        const chatId = msg.from;

        // Init Wadah Game
        if (!client.mcSession) client.mcSession = {};
        
        const command = args[0] ? args[0].toLowerCase() : 'help';

        // ==========================================
        // 1. LOBBY SYSTEM
        // ==========================================
        
        // !mc create
        if (command === 'create') {
            if (client.mcSession[chatId]) return msg.reply('⚠️ Sudah ada game berjalan!');
            
            client.mcSession[chatId] = {
                phase: 'LOBBY', // LOBBY, SHOP, PREPARE, BATTLE
                players: {}, // Data pemain
                round: 1,
                shop: [] // Hero yang dijual saat ini
            };

            // Helper Player Baru
            const createPlayer = (id, name) => ({
                id: id,
                name: name,
                hp: 100,      // Nyawa Commander
                gold: 10,     // Uang Awal
                bench: [],    // Hero Cadangan
                board: { front: null, back: null }, 
                synergies: [] 
            });

            // Auto Join Host
            client.mcSession[chatId].players[senderId] = createPlayer(senderId, contact.pushname);
            
            // --- PERBAIKAN DI SINI (TAMBAH undefined) ---
            return msg.reply(
                `♟️ *MAGIC CHESS LITE* ♟️\n\nLobby dibuat! Menunggu pemain...\nHost: @${contact.id.user}\n\n👉 Ketik *!mc join* untuk masuk.\n👉 Ketik *!mc start* untuk mulai.`, 
                undefined, 
                { mentions: [senderId] }
            );
        }

        // !mc join
        if (command === 'join') {
            const game = client.mcSession[chatId];
            if (!game) return msg.reply('❌ Belum ada lobby. Ketik *!mc create* dulu.');
            if (game.phase !== 'LOBBY') return msg.reply('❌ Game sudah dimulai, tunggu ronde berikutnya.');
            if (game.players[senderId]) return msg.reply('❌ Kamu sudah join!');

            // Maksimal 2 Orang dulu (Versi Lite)
            if (Object.keys(game.players).length >= 2) return msg.reply('❌ Lobby penuh (Max 2 Player).');

            const createPlayer = (id, name) => ({
                id: id,
                name: name,
                hp: 100, gold: 10, bench: [],
                board: { front: null, back: null }, synergies: [] 
            });

            game.players[senderId] = createPlayer(senderId, contact.pushname);
            
            // --- PERBAIKAN DI SINI (TAMBAH undefined) ---
            return msg.reply(
                `✅ @${contact.id.user} bergabung! (${Object.keys(game.players).length}/2 Player)`, 
                undefined, 
                { mentions: [senderId] }
            );
        }

        // !mc start
        if (command === 'start') {
            const game = client.mcSession[chatId];
            if (!game) return;
            // if (Object.keys(game.players).length < 2) return msg.reply('❌ Butuh minimal 2 pemain!');

            game.phase = 'SHOP';
            await msg.reply(`⚔️ *GAME DIMULAI!* ⚔️\n\nSetiap pemain diberi modal awal: *10 Gold*.\nSilakan belanja Hero dulu!`);
            
            // Generate Shop Otomatis
            return generateShop(client, msg, chatId);
        }

        // ==========================================
        // 2. GAMEPLAY (SHOP & INVENTORY)
        // ==========================================

        const game = client.mcSession[chatId];
        if (!game) return msg.reply('❌ Tidak ada game aktif.');
        
        // Validasi apakah pengirim adalah pemain?
        if (!game.players[senderId]) return msg.reply('❌ Kamu penonton, gak usah ikut campur.');

        const player = game.players[senderId];

        // !mc shop (Cek Toko)
        if (command === 'shop') {
            let text = `🛒 *TOKO HERO (Gold: ${player.gold})*\n`;
            text += `_Ronde: ${game.round}_\n\n`;

            game.shop.forEach((hero, index) => {
                text += `${index + 1}. ${hero.emoji} *${hero.name}* (${hero.role}) - 💰${hero.price}\n`;
                text += `   HP: ${hero.hp} | ATK: ${hero.atk}\n`;
            });

            text += `\n👉 Ketik *!mc buy [nomor]* untuk beli.\n👉 Ketik *!mc refresh* (2 Gold) untuk ganti hero.\n👉 Ketik *!mc next* jika sudah siap.`;
            return msg.reply(text);
        }

        // !mc buy [nomor]
        if (command === 'buy') {
            const index = parseInt(args[1]) - 1;
            if (isNaN(index) || !game.shop[index]) return msg.reply('❌ Hero tidak ditemukan.');

            const hero = game.shop[index];

            // Cek Gold
            if (player.gold < hero.price) return msg.reply(`💸 Gold kurang! Harga: ${hero.price}, Punya kamu: ${player.gold}`);

            // Cek Slot Inventory (Bench)
            if (player.bench.length >= 5) return msg.reply('❌ Kursi cadangan (Bench) penuh! Jual dulu atau pasang ke board.');

            // Proses Beli
            player.gold -= hero.price;
            player.bench.push({ ...hero, uid: Date.now() + Math.random() }); // Clone hero + ID unik

            return msg.reply(`✅ Kamu membeli *${hero.name}*!\nSisa Gold: ${player.gold}\nCek inventory: *!mc info*`);
        }

        // !mc info (Cek Pasukan)
        if (command === 'info') {
            let text = `📊 *INFO PASUKAN @${contact.id.user}* 📊\n`;
            text += `💰 Gold: ${player.gold} | ❤️ HP Commander: ${player.hp}\n\n`;

            text += `🏟️ *BOARD (Lapangan - Siap Tempur)*\n`;
            text += `[DEPAN]: ${player.board.front ? player.board.front.emoji + ' ' + player.board.front.name : '(Kosong)'}\n`;
            text += `[BELAKANG]: ${player.board.back ? player.board.back.emoji + ' ' + player.board.back.name : '(Kosong)'}\n\n`;

            text += `🪑 *BENCH (Cadangan)*\n`;
            if (player.bench.length === 0) text += `_(Kosong)_\n`;
            player.bench.forEach((h, i) => {
                text += `${i + 1}. ${h.emoji} ${h.name} (${h.role})\n`;
            });

            text += `\n👉 Pasang Hero: *!mc set depan [nomor_bench]*\n👉 Pasang Hero: *!mc set belakang [nomor_bench]*`;
            
            // --- PERBAIKAN DI SINI ---
            return msg.reply(text, undefined, { mentions: [senderId] });
        }
        
        // !mc set [posisi] [nomor_bench]
        if (command === 'set') {
            const pos = args[1]; // depan / belakang
            const index = parseInt(args[2]) - 1;

            if (!['depan', 'belakang'].includes(pos)) return msg.reply('❌ Posisi salah! Pilih: *depan* atau *belakang*.');
            if (isNaN(index) || !player.bench[index]) return msg.reply('❌ Hero di bench tidak ditemukan.');

            // Ambil hero dari bench
            const hero = player.bench[index];

            // Jika posisi sudah terisi, tukar hero (Swap)
            let swappedHero = null;
            if (pos === 'depan' && player.board.front) swappedHero = player.board.front;
            if (pos === 'belakang' && player.board.back) swappedHero = player.board.back;

            // Pasang Hero Baru
            if (pos === 'depan') player.board.front = hero;
            if (pos === 'belakang') player.board.back = hero;

            // Hapus hero dari bench
            player.bench.splice(index, 1);

            // Kembalikan hero lama ke bench (jika ada swap)
            if (swappedHero) player.bench.push(swappedHero);

            return msg.reply(`✅ *${hero.name}* dipasang di baris *${pos.toUpperCase()}*!`);
        }

        // !mc help
        if (command === 'help') {
             return msg.reply(`📖 *PANDUAN MAGIC CHESS*
1. *!mc create* - Buat Lobby
2. *!mc join* - Masuk Lobby
3. *!mc start* - Mulai Game
4. *!mc shop* - Buka Toko Hero
5. *!mc buy [no]* - Beli Hero
6. *!mc info* - Cek Pasukan & Gold
7. *!mc set [depan/belakang] [no]* - Pasang Hero`);
        }
    }
};

// --- HELPER FUNCTIONS ---

async function generateShop(client, msg, chatId) {
    const game = client.mcSession[chatId];
    const shopSize = 5;
    const newShop = [];

    // Random Hero dari Database
    for (let i = 0; i < shopSize; i++) {
        const randomHero = mcData.heroes[Math.floor(Math.random() * mcData.heroes.length)];
        newShop.push(randomHero);
    }

    game.shop = newShop;

    let text = `🛒 *TOKO RONDE ${game.round} DIBUKA!* 🛒\n`;
    text += `Semua pemain silakan belanja!\nKetik *!mc shop* untuk melihat daftar hero.\n\n_Waktu belanja bebas, kalau sudah siap ketik !mc next (Coming Soon)_`;
    
    // Ini aman karena chatId adalah string, bukan object
    await client.sendMessage(chatId, text);
}