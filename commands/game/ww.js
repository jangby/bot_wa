const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    name: 'ww',
    description: 'Game Werewolf Ultimate',
    async execute(client, msg, args, { chat, contact, isOwner }) {
        // Inisialisasi Database Game di Memory
        if (!client.wwGames) client.wwGames = {};
        if (!client.wwPlayers) client.wwPlayers = {}; // Mapping Pemain (PC) ke Grup

        const senderId = contact.id._serialized;
        const isPC = !chat.isGroup;
        const cmd = args[0] ? args[0].toLowerCase() : '';

        // ==========================================
        // 1. FASE MALAM HARI (DI PRIVATE CHAT)
        // ==========================================
        if (isPC) {
            const groupId = client.wwPlayers[senderId];
            if (!groupId) return; // Tidak sedang main game apa-apa
            
            const game = client.wwGames[groupId];
            if (!game || game.phase !== 'night') return; // Bukan malam hari
            
            const targetNum = parseInt(cmd);
            if (isNaN(targetNum)) return msg.reply('❌ Masukkan nomor urut pemain yang valid!\nContoh: *!ww 2*');
            
            const myRole = game.roles[senderId];
            if (!myRole || !myRole.isAlive || myRole.role === 'villager') return;
            
            const targetIndex = targetNum - 1;
            const targetPlayer = game.players[targetIndex];
            if (!targetPlayer) return msg.reply('❌ Nomor pemain tidak ditemukan di daftar!');
            
            const targetId = targetPlayer.id;
            const targetRole = game.roles[targetId];
            
            if (!targetRole.isAlive) return msg.reply('❌ Target sudah mati, biarkan dia tenang. Pilih yang lain!');
            if (targetId === senderId && myRole.role !== 'guard') return msg.reply('❌ Kamu tidak bisa memilih dirimu sendiri!');

            // Simpan aksi malam ini
            game.nightActions[myRole.role] = targetId;

            if (myRole.role === 'werewolf') {
                await msg.reply(`🐺 Target terkunci: *${targetPlayer.name}*. Dia akan mati malam ini.`);
            } else if (myRole.role === 'serial_killer') {
                await msg.reply(`🔪 Target pembunuhanmu terkunci: *${targetPlayer.name}*.`);
            } else if (myRole.role === 'seer') {
                const isBad = ['werewolf', 'serial_killer'].includes(targetRole.role);
                const roleName = isBad ? 'JAHAT 🐺🔪' : 'BAIK 🧑‍🌾';
                await msg.reply(`👁️ Terawang selesai: *${targetPlayer.name}* adalah seseorang yang *${roleName}*.`);
            } else if (myRole.role === 'guard') {
                await msg.reply(`🛡️ Kamu menjaga pintu *${targetPlayer.name}* malam ini dari serangan apapun.`);
            }
            return;
        }

        // ==========================================
        // 2. PERINTAH DI GRUP
        // ==========================================
        const chatId = chat.id._serialized;
        let game = client.wwGames[chatId];

        // --- BANTUAN & ROLE ---
        if (cmd === 'role') {
            return msg.reply(`🐺 *DAFTAR PERAN WEREWOLF*\n\n🧑‍🌾 *Villager:* Tidak punya kekuatan, cari tahu siapa werewolf saat siang!\n🐺 *Werewolf:* Bunuh 1 orang setiap malam.\n👁️ *Seer:* Bisa menerawang 1 orang tiap malam (Jahat/Baik).\n🛡️ *Guard:* Melindungi 1 orang tiap malam dari pembunuhan.\n🔪 *Serial Killer:* Pembunuh berdarah dingin. Bunuh semua orang dan bertahan sendirian sampai akhir!`);
        }

        // --- BUAT ROOM ---
        if (cmd === 'play') {
            if (game) return msg.reply('⚠️ Masih ada game yang sedang berjalan/lobby di grup ini!');
            
            client.wwGames[chatId] = {
                phase: 'lobby',
                host: senderId,
                day: 1,
                players: [{ id: senderId, name: contact.pushname || 'Player' }],
                roles: {},
                nightActions: {},
                votes: {}
            };
            return chat.sendMessage('🐺 *LOBBY WEREWOLF DIBUKA!*\n\nKetik *!ww join* untuk ikut bermain.\nHost (Pembuat Room) ketik *!ww start* jika pemain sudah cukup (Minimal 4).');
        }

        // --- JOIN ROOM ---
        if (cmd === 'join') {
            if (!game || game.phase !== 'lobby') return msg.reply('⚠️ Belum ada lobby yang dibuka. Ketik *!ww play*.');
            if (game.players.find(p => p.id === senderId)) return msg.reply('✅ Kamu sudah ada di dalam lobby.');
            if (game.players.length >= 27) return msg.reply('❌ Lobby Penuh (Maks 27 Pemain)!');
            
            game.players.push({ id: senderId, name: contact.pushname || 'Player' });
            return msg.reply(`✅ Bergabung! Total pemain: ${game.players.length}`);
        }

        // --- LIHAT PEMAIN / STATUS ---
        if (cmd === 'player' || cmd === 'status') {
            if (!game) return msg.reply('⚠️ Tidak ada game yang sedang berjalan.');
            let list = `📋 *DAFTAR PEMAIN (HARI KE-${game.day}):*\nFase: ${game.phase.toUpperCase()}\n\n`;
            game.players.forEach((p, index) => {
                const r = game.roles[p.id];
                const status = r ? (r.isAlive ? '💖 Hidup' : '💀 Mati') : '⏳ Menunggu';
                list += `${index + 1}. ${p.name} - ${status}\n`;
            });
            return chat.sendMessage(list);
        }

        // --- LEAVE / STOP ---
        if (cmd === 'leave' || cmd === 'stop') {
            if (!game) return msg.reply('⚠️ Tidak ada game yang berjalan.');
            if (game.host === senderId || isOwner) {
                delete client.wwGames[chatId];
                return msg.reply('⏹️ Game Werewolf dihentikan.');
            } else {
                return msg.reply('❌ Hanya Host / Owner yang bisa menghentikan game.');
            }
        }

        // --- START GAME ---
        if (cmd === 'start') {
            if (!game || game.phase !== 'lobby') return;
            if (game.host !== senderId && !isOwner) return msg.reply('❌ Hanya Host yang bisa memulai permainan.');
            if (game.players.length < 4) return msg.reply('❌ Minimal butuh 4 pemain!');

            game.phase = 'starting';
            await chat.sendMessage('🌙 *PERMAINAN DIMULAI!*\n\nMembagikan peran... Pastikan nomor bot ini tidak diblokir agar bisa menerima pesan peran di Private Chat (PC)!');

            const pCount = game.players.length;
            let rolePool = [];
            
            // Distribusi Role Cerdas
            if (pCount >= 4 && pCount <= 6) {
                rolePool = ['werewolf', 'seer', ...Array(pCount - 2).fill('villager')];
            } else if (pCount >= 7 && pCount <= 9) {
                rolePool = ['werewolf', 'werewolf', 'seer', 'guard', ...Array(pCount - 4).fill('villager')];
            } else {
                rolePool = ['werewolf', 'werewolf', 'serial_killer', 'seer', 'guard', ...Array(pCount - 5).fill('villager')];
            }
            
            // Acak Peran
            rolePool = rolePool.sort(() => Math.random() - 0.5);

            for (let i = 0; i < pCount; i++) {
                const pId = game.players[i].id;
                const rName = rolePool[i];
                
                game.roles[pId] = { role: rName, isAlive: true, name: game.players[i].name };
                client.wwPlayers[pId] = chatId; // Mapping PC ke Grup

                let roleMsg = `[GAME WEREWOLF GRUP]\n`;
                if (rName === 'werewolf') roleMsg += `🐺 *KAMU ADALAH WEREWOLF*\nTugasmu membunuh warga desa. Saat bot memberitahu malam tiba, balas bot ini dengan angka targetmu!`;
                else if (rName === 'serial_killer') roleMsg += `🔪 *KAMU ADALAH SERIAL KILLER*\nTugasmu membunuh semua orang. Saat malam, balas bot ini dengan angka targetmu!`;
                else if (rName === 'seer') roleMsg += `👁️ *KAMU ADALAH SEER*\nSaat malam, balas bot ini dengan angka target untuk menerawang perannya.`;
                else if (rName === 'guard') roleMsg += `🛡️ *KAMU ADALAH GUARD*\nSaat malam, balas bot ini dengan angka target untuk melindunginya.`;
                else roleMsg += `🧑‍🌾 *KAMU ADALAH VILLAGER*\nTemukan Werewolf saat siang hari dan voting untuk mengeksekusi mereka!`;

                try {
                    await client.sendMessage(pId, roleMsg);
                } catch (e) {
                    await chat.sendMessage(`⚠️ Gagal mengirim pesan ke @${pId.split('@')[0]}. Tolong chat PING ke bot ini dulu.`, { mentions: [pId] });
                }
            }

            await delay(3000);
            return startNight(client, chat, game, chatId);
        }

        // --- SISTEM VOTING SIANG HARI ---
        if (cmd === 'vote') {
            if (!game || game.phase !== 'voting') return msg.reply('⚠️ Ini bukan waktunya voting!');
            const myRole = game.roles[senderId];
            if (!myRole || !myRole.isAlive) return msg.reply('💀 Orang mati dilarang ikut campur urusan orang hidup!');

            const targetNum = parseInt(args[1]);
            if (isNaN(targetNum) || !game.players[targetNum - 1]) return msg.reply('❌ Format salah! Contoh: *!ww vote 2*');

            const targetId = game.players[targetNum - 1].id;
            if (!game.roles[targetId].isAlive) return msg.reply('❌ Orang itu sudah mati!');

            game.votes[senderId] = targetId;
            await msg.reply(`✅ Kamu mem-vote *${game.players[targetNum - 1].name}*.`);

            // Jika semua yang hidup sudah vote, langsung proses eksekusi
            const aliveCount = Object.values(game.roles).filter(r => r.isAlive).length;
            if (Object.keys(game.votes).length >= aliveCount) {
                await processVoteResults(client, chat, game, chatId);
            }
            return;
        }
    }
};

// ==========================================
// ⚙️ MESIN SIKLUS OTOMATIS (HELPER)
// ==========================================

async function startNight(client, chat, game, chatId) {
    game.phase = 'night';
    game.nightActions = {};
    
    let pList = '\n\n*Daftar Pemain (Pilih Angkanya di PC):*\n';
    game.players.forEach((p, i) => {
        const isAlive = game.roles[p.id].isAlive;
        pList += `${i + 1}. ${p.name} ${isAlive ? '💖' : '💀'}\n`;
    });

    await chat.sendMessage(`🌙 *MALAM HARI KE-${game.day} TIBA*\n\nWarga desa tertidur lelap. Para peran khusus, silakan cek PC bot untuk melakukan aksi! Waktu kalian *60 Detik*.`);

    // Broadcast instruksi ke PC peran khusus
    for (const [pId, data] of Object.entries(game.roles)) {
        if (data.isAlive && data.role !== 'villager') {
            try { await client.sendMessage(pId, `Malam tiba! Siapa targetmu? Balas dengan angkanya saja (Contoh: *!ww 2*).${pList}`); } catch(e){}
        }
    }

    // Timer Malam (60 Detik)
    await delay(60000);

    // Cek apakah game masih ada setelah delay
    if (!client.wwGames[chatId] || client.wwGames[chatId].day !== game.day) return; 

    // EVALUASI MALAM
    game.phase = 'day';
    const wwTarget = game.nightActions['werewolf'];
    const skTarget = game.nightActions['serial_killer'];
    const guardTarget = game.nightActions['guard'];

    let victims = [];
    if (wwTarget && wwTarget !== guardTarget) victims.push(wwTarget);
    if (skTarget && skTarget !== guardTarget) victims.push(skTarget);
    
    // Hapus duplikat jika WW dan SK membunuh orang yang sama
    victims = [...new Set(victims)];
    victims.forEach(vId => game.roles[vId].isAlive = false);

    let msgDay = `☀️ *PAGI HARI KE-${game.day} TIBA*\n\n`;
    if (victims.length > 0) {
        msgDay += `Tragedi mengerikan terjadi semalam! Korban tewas: \n`;
        victims.forEach(vId => { msgDay += `- 💀 *${game.roles[vId].name}*\n`; });
        msgDay += `\n`;
    } else {
        msgDay += `Malam yang damai. Guard berhasil melindungi atau tidak ada korban jiwa semalam! 🎉\n\n`;
    }

    const winStatus = checkWinCondition(game);
    if (winStatus) {
        await chat.sendMessage(msgDay + winStatus);
        delete client.wwGames[chatId];
        return;
    }

    msgDay += `Silakan berdiskusi (Waktu: *2 Menit*). Jika menemukan pelakunya, ketik *!ww vote <angka_pemain>*.\nKetik *!ww status* untuk mengingat nomor urut.`;
    game.phase = 'voting';
    game.votes = {};
    await chat.sendMessage(msgDay);

    // Timer Voting (120 Detik)
    await delay(120000);
    if (client.wwGames[chatId] && client.wwGames[chatId].phase === 'voting' && client.wwGames[chatId].day === game.day) {
        await chat.sendMessage('⏳ Waktu diskusi dan voting habis! Mengevaluasi suara mayoritas...');
        await processVoteResults(client, chat, game, chatId);
    }
}

async function processVoteResults(client, chat, game, chatId) {
    game.phase = 'processing';
    
    if (Object.keys(game.votes).length === 0) {
        await chat.sendMessage('⚖️ Tidak ada yang divote hari ini. Warga memilih untuk damai.');
    } else {
        const counts = {};
        for (const v of Object.values(game.votes)) counts[v] = (counts[v] || 0) + 1;
        
        let maxVotes = 0;
        let executedId = null;
        let tie = false;
        
        for (const [tId, c] of Object.entries(counts)) {
            if (c > maxVotes) {
                maxVotes = c;
                executedId = tId;
                tie = false;
            } else if (c === maxVotes) {
                tie = true;
            }
        }

        if (tie || !executedId) {
            await chat.sendMessage('⚖️ Hasil voting seri! Tidak ada bukti kuat. Tidak ada yang dieksekusi hari ini.');
        } else {
            game.roles[executedId].isAlive = false;
            await chat.sendMessage(`⚖️ Mayoritas warga sepakat. 💀 *${game.roles[executedId].name}* dieksekusi mati di tengah alun-alun desa!`);
        }
    }

    const winStatus = checkWinCondition(game);
    if (winStatus) {
        await chat.sendMessage(winStatus);
        delete client.wwGames[chatId];
        return;
    }

    game.day++;
    await chat.sendMessage('Matahari terbenam, malam akan segera tiba kembali...');
    await delay(5000);
    return startNight(client, chat, game, chatId);
}

function checkWinCondition(game) {
    let ww = 0, villager = 0, sk = 0;
    
    for (const r of Object.values(game.roles)) {
        if (r.isAlive) {
            if (r.role === 'werewolf') ww++;
            else if (r.role === 'serial_killer') sk++;
            else villager++;
        }
    }
    
    if (ww === 0 && sk === 0) return `\n\n🏆 *WARGA DESA MENANG!*\nSemua penjahat telah musnah. Desa kembali aman untuk selamanya!`;
    if (ww >= (villager + sk) && ww > 0) return `\n\n🐺 *WEREWOLF MENANG!*\nJumlah Werewolf sudah setara atau melebihi warga tersisa. Desa telah dikuasai!`;
    if (sk >= (ww + villager) && sk > 0) return `\n\n🔪 *SERIAL KILLER MENANG!*\nPsikopat itu berhasil membunuh semua penduduk desa dan menjadi orang terakhir yang hidup!`;
    
    return null; // Belum ada yang menang
}