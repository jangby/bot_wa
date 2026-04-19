const uang = require('./uang');
const bankSoal = require('../data/bankSoal');

// Helper Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async (client, msg) => {
    try {
        const chatId = msg.from;
        const body = msg.body.toLowerCase().trim();
        const contact = await msg.getContact();
        const senderId = contact.id._serialized;

        // Pastikan wadah game ada
        if (!client.gameStates) client.gameStates = {};
        const games = client.gameStates;
        const game = games[chatId];
        
        if (!game) return false;

        // ==========================================
        // 1. TIC TAC TOE (DIPULIHKAN)
        // ==========================================
        if (game.type === 'ttt') {
            // Cek apakah input adalah angka 1-9?
            if (/^[1-9]$/.test(body)) {
                const isPlayerX = senderId === game.playerX;
                const isPlayerO = senderId === game.playerO;
                
                // Cek Giliran
                if ((game.turn === 'X' && !isPlayerX) || (game.turn === 'O' && !isPlayerO)) {
                    // Jika bukan gilirannya, abaikan (atau boleh kasih react ❌)
                    return true; 
                }

                // Cek apakah kotak masih kosong?
                const index = parseInt(body) - 1;
                if (game.board[index] === 'X' || game.board[index] === 'O') {
                    await msg.reply('⚠️ Kotak itu sudah diisi!');
                    return true;
                }

                // Isi Papan
                game.board[index] = game.turn;
                game.moves++;

                // Helper Gambar Papan
                const drawBoard = () => `\`\`\` ${game.board[0]} | ${game.board[1]} | ${game.board[2]} \n---+---+---\n ${game.board[3]} | ${game.board[4]} | ${game.board[5]} \n---+---+---\n ${game.board[6]} | ${game.board[7]} | ${game.board[8]} \`\`\``;

                // Cek Menang
                const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                const isWin = wins.some(p => game.board[p[0]] === game.board[p[1]] && game.board[p[1]] === game.board[p[2]]);

                if (isWin) {
                    const winner = game.turn === 'X' ? game.playerX : game.playerO;
                    // Hadiah kecil hiburan
                    const hadiah = 77777;
                    uang.addSaldo(winner, hadiah);

                    await client.sendMessage(chatId, `🏆 *GAME SELESAI!*\n\nSelamat @${winner.split('@')[0]} menang!\nHadiah: ${uang.formatRupiah(hadiah)}\n\n${drawBoard()}`, { mentions: [winner] });
                    delete games[chatId];
                } 
                // Cek Seri (Papan Penuh)
                else if (game.moves === 9) {
                    await client.sendMessage(chatId, `🤝 *SERI!*\nTidak ada pemenang.\n\n${drawBoard()}`);
                    delete games[chatId];
                } 
                // Ganti Giliran
                else {
                    game.turn = game.turn === 'X' ? 'O' : 'X';
                    const nextPlayer = game.turn === 'X' ? game.playerX : game.playerO;
                    
                    await client.sendMessage(chatId, `Giliran: *${game.turn}* (@${nextPlayer.split('@')[0]})\n\n${drawBoard()}`, { mentions: [nextPlayer] });
                }
                return true;
            }
        }

        // ==========================================
// 2. KUIS MULTI-SESI (UPDATE)
// ==========================================

// --- FASE LOBBY (PENDAFTARAN) ---
if (game.type === 'kuis_lobby') {
    if (body === '!join kuis') {
        if (game.players.includes(senderId)) return msg.reply('❌ Kamu sudah terdaftar.');
        game.players.push(senderId);
        game.scores[senderId] = 0; // Inisialisasi saldo sesi ini
        await msg.reply(`✅ @${senderId.split('@')[0]} bergabung! Total: ${game.players.length} pemain.`, { mentions: [senderId] });
        return true;
    }

    if (body === '!start') {
        if (game.players.length < 1) return msg.reply('❌ Minimal harus ada 1 orang yang bergabung!');
        if (!game.players.includes(senderId)) return msg.reply('❌ Hanya pemain yang terdaftar yang bisa memulai.');

        game.type = 'kuis_active';
        return startKuisSession(client, chatId, game); // Panggil fungsi mulai soal
    }
}

// --- FASE PERMAINAN BERLANGSUNG ---
if (game.type === 'kuis_active') {
    // Cek apakah pengirim adalah pemain terdaftar
    if (!game.players.includes(senderId)) return false; 

    if (body.includes(game.currentJawaban)) {
        const hadiah = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000; // Rentang 5k - 15k
        game.scores[senderId] += hadiah;
        uang.addSaldo(senderId, hadiah, 'Menang Kuis');

        await msg.reply(`🎉 *BENAR!* (+${uang.formatRupiah(hadiah)})\n\n@${senderId.split('@')[0]} menjawab: *${game.currentJawaban.toUpperCase()}*`, { mentions: [senderId] });
        
        game.questionCount++;

        // Cek apakah sudah 10 soal
        if (game.questionCount >= game.maxQuestions) {
            let resultMsg = `🏁 *KUIS SELESAI* 🏁\n\nBerikut perolehan saldo total sesi ini:\n`;
            
            // Urutkan skor tertinggi
            const sortedPlayers = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
            sortedPlayers.forEach(([pid, score], i) => {
                resultMsg += `${i + 1}. @${pid.split('@')[0]} : *${uang.formatRupiah(score)}*\n`;
            });

            await client.sendMessage(chatId, resultMsg, { mentions: game.players });
            delete client.gameStates[chatId];
        } else {
            // Lanjut soal berikutnya
            await delay(2000);
            return startKuisSession(client, chatId, game);
        }
        return true;
    }
}

// Fungsi Helper untuk mengirim soal (Taruh di luar atau di atas gameHandler)
async function startKuisSession(client, chatId, game) {
    const soal = bankSoal[Math.floor(Math.random() * bankSoal.length)];
    game.currentJawaban = soal.jawaban.toLowerCase();
    
    const teks = `❓ *PERTANYAAN KE ${game.questionCount + 1}/${game.maxQuestions}* ❓\n\n` +
                 `${soal.soal}\n\n` +
                 `⏳ Jawab sekarang! (Hanya untuk pemain terdaftar)`;
    
    await client.sendMessage(chatId, teks);
    return true;
}

        // ==========================================
        // 3. SAMBUNG KATA
        // ==========================================
        if (game.type === 'sambungkata') {
            if (!body.includes(' ') && body.startsWith(game.lastLetter)) {
                if (client.kamus && !client.kamus.has(body)) {
                    await msg.react('❌'); 
                    return true;
                }
                if (game.usedWords.includes(body)) {
                    await msg.reply(`⚠️ Kata *${body}* sudah dipakai!`);
                    return true;
                }
                const hadiah = 500;
                uang.addSaldo(senderId, hadiah);
                game.usedWords.push(body);
                game.lastLetter = body.slice(-1);
                await msg.reply(`✅ *Lanjut!* Huruf: *${game.lastLetter.toUpperCase()}* (+${uang.formatRupiah(hadiah)})`);
                return true;
            }
        }

        // ==========================================
        // 4. SAMBUNG AYAM (LIVE BATTLE)
        // ==========================================
        if (game.type === 'sambungayam') {
            // Cek Pembatalan
            if (body === '!batal') {
                if (senderId === game.challenger) {
                    uang.addSaldo(game.challenger, game.bet);
                    delete games[chatId];
                    await msg.reply('✅ Pertarungan dibatalkan.');
                    return true;
                } else {
                    await msg.reply('❌ Hanya penantang yang bisa membatalkan.');
                    return true;
                }
            }

            // Cek Penerimaan
            if (body === '!gas' || body === '!terima') {
                if (senderId !== game.opponent) {
                    if (senderId === game.challenger) {
                        await msg.reply('❌ Sabar, nunggu lawan terima!');
                    } else {
                        await msg.reply(`❌ Heeii! Yang ditantang itu @${game.opponent.split('@')[0]}!`);
                    }
                    return true; 
                }

                if (uang.cekSaldo(senderId) < game.bet) {
                    await msg.reply(`💸 Uangmu kurang bos! Butuh: ${uang.formatRupiah(game.bet)}`);
                    return true;
                }

                uang.kurangSaldo(senderId, game.bet);

                // Setup Ayam
                const classes = [
                    { name: 'Bangkok', hp: 100, atk: 30, crit: 15 },
                    { name: 'Kampung', hp: 120, atk: 20, crit: 25 },
                    { name: 'Kate', hp: 80, atk: 40, crit: 35 },
                    { name: 'Cemani', hp: 150, atk: 15, crit: 10 },
                    { name: 'Robot', hp: 200, atk: 10, crit: 5 }
                ];

                let ayam1 = { ...classes[Math.floor(Math.random() * classes.length)], owner: game.challenger, symbol: '🔴' };
                let ayam2 = { ...classes[Math.floor(Math.random() * classes.length)], owner: game.opponent, symbol: '🔵' };

                // Cek Buff (Obat)
                const cekBuff = (ayam, inv) => {
                    if (inv && inv['obat'] && inv['obat'] > 0) {
                        uang.useItem(ayam.owner, 'obat');
                        ayam.hp = Math.floor(ayam.hp * 1.5);
                        ayam.name += ' 💊';
                    }
                };
                cekBuff(ayam1, uang.cekInventory(ayam1.owner));
                cekBuff(ayam2, uang.cekInventory(ayam2.owner));

                // Intro Live
                await client.sendMessage(chatId, 
                    `🥊 *FIGHT START!* 🥊\n\n` +
                    `${ayam1.symbol} @${ayam1.owner.split('@')[0]} (${ayam1.name})\n` +
                    `          *VS* \n` +
                    `${ayam2.symbol} @${ayam2.owner.split('@')[0]} (${ayam2.name})`,
                    { mentions: [ayam1.owner, ayam2.owner] }
                );
                
                await delay(2000);

                while (ayam1.hp > 0 && ayam2.hp > 0) {
                    const attacker = Math.random() > 0.5 ? ayam1 : ayam2;
                    const defender = attacker === ayam1 ? ayam2 : ayam1;

                    let damage = Math.floor(Math.random() * attacker.atk) + 10;
                    let isCrit = Math.random() * 100 < attacker.crit;
                    let attackText = '';

                    if (isCrit) {
                        damage *= 2;
                        attackText = `💥 *CRIT!* Ayam ${attacker.symbol} ngamuk!`;
                    } else {
                        const skills = ['mematuk', 'menendang', 'mencakar', 'menabrak', 'ngaplak'];
                        const skill = skills[Math.floor(Math.random() * skills.length)];
                        attackText = `⚔️ Ayam ${attacker.symbol} ${skill} lawan.`;
                    }

                    defender.hp -= damage;
                    if (defender.hp < 0) defender.hp = 0;

                    const status = `${attackText} (-${damage})\n\n` +
                                   `${ayam1.symbol} HP: ${ayam1.hp} | ${ayam2.symbol} HP: ${ayam2.hp}`;
                    
                    await client.sendMessage(chatId, status);
                    
                    if (ayam1.hp > 0 && ayam2.hp > 0) await delay(2000);
                }

                const winnerId = ayam1.hp > 0 ? ayam1.owner : ayam2.owner;
                const totalHadiah = game.bet * 2;
                uang.addSaldo(winnerId, totalHadiah);

                await delay(1000);
                await client.sendMessage(chatId, 
                    `🏆 *KO! GAME SELESAI* 🏆\n\n` +
                    `Pemenang: @${winnerId.split('@')[0]}\n` +
                    `Hadiah: *${uang.formatRupiah(totalHadiah)}*`,
                    { mentions: [winnerId] }
                );
                
                delete games[chatId]; 
                return true;
            }
        }

        // ==========================================
        // 5. RAID BOSS (RPG CO-OP)
        // ==========================================
        if (game.type === 'raid_lobby') {
            // --- FITUR JOIN ---
            if (body === '!join') {
                if (game.players.includes(senderId)) return msg.reply('❌ Kamu sudah masuk lobby.');
                if (game.players.length >= game.maxPlayers) return msg.reply('❌ Lobby Penuh!');

                game.players.push(senderId);
                
                await client.sendMessage(chatId, `✅ @${senderId.split('@')[0]} bergabung! (${game.players.length}/${game.maxPlayers})`, {
                    mentions: [senderId]
                });
                return true;
            }

            // --- FITUR START ---
            if (body === '!start') {
                if (!game.players.includes(senderId)) return msg.reply('❌ Hanya pemain yang bisa start.');
                // if (game.players.length < 4) return msg.reply('❌ Butuh minimal 4 orang!'); // Un-comment kalau mau strict

                // UBAH STATE JADI BATTLE
                game.type = 'raid_battle';
                game.boss = {
                    name: 'Naga Ijo',
                    hp: 5000,
                    maxHp: 5000,
                    atk: 150
                };
                
                // Siapkan Status Pemain (HP & Damage berdasarkan Level)
                game.stats = {};
                for (let pid of game.players) {
                    const userLvl = levelSystem.getUser(pid); // Ambil data level
                    const level = userLvl.level || 0;
                    
                    // Rumus: HP Dasar 500 + (Level * 50)
                    // Rumus: ATK Dasar 50 + (Level * 10)
                    game.stats[pid] = {
                        hp: 500 + (level * 50),
                        maxHp: 500 + (level * 50),
                        atk: 50 + (level * 10),
                        isDead: false,
                        level: level
                    };
                }

                await client.sendMessage(chatId, `🐉 *ROAR!! NAGA IJO MUNCUL!* 🐉\n\nHP Boss: *${game.boss.hp}*\n\nGiliran Pemain!\n⚔️ Ketik *!serang* untuk menyerang\n💊 Ketik *!heal* untuk memulihkan diri (Bayar 500)`);
                return true;
            }
        }

        if (game.type === 'raid_battle') {
            // Validasi Pemain
            if (!game.players.includes(senderId)) return false; 
            const playerStat = game.stats[senderId];

            if (playerStat.isDead) {
                await msg.reply('💀 Kamu sudah mati! Tidak bisa apa-apa.');
                return true;
            }

            // --- AKSI SERANG ---
            if (body === '!serang') {
                // Hitung Damage (Randomized dikit biar seru)
                // Damage = Base ATK + Random(0-20)
                const dmg = playerStat.atk + Math.floor(Math.random() * 20);
                
                // Critical Hit (20% chance)
                let isCrit = Math.random() < 0.2;
                const finalDmg = isCrit ? dmg * 2 : dmg;

                game.boss.hp -= finalDmg;

                let txt = isCrit ? `💥 *CRITICAL!* ` : `⚔️ `;
                txt += `@${senderId.split('@')[0]} memberi damage *${finalDmg}*!`;
                
                await client.sendMessage(chatId, txt, { mentions: [senderId] });

                // --- CEK BOSS MATI ---
                if (game.boss.hp <= 0) {
                    const rewardMoney = 50000;
                    const rewardXP = 500;

                    let winMsg = `🏆 *VICTORY!* 🏆\n\nNaga Ijo telah dikalahkan!\nSemua anggota party yang selamat mendapat:\n💰 Rp ${uang.formatRupiah(rewardMoney)}\n✨ +${rewardXP} XP\n\n`;

                    // Bagi Hadiah
                    for (let pid of game.players) {
                        if (!game.stats[pid].isDead) {
                            uang.addSaldo(pid, rewardMoney, 'Hadiah Raid Boss');
                            // Manual add XP (looping addXp logic or create custom function)
                            // Di sini kita addSaldo saja biar simpel, XP otomatis nambah krn mereka ngechat
                        }
                    }

                    // CETAK STRUK KEMENANGAN
                    try {
                        printer.printStruk({
                            id: Date.now(),
                            sender: game.players[0], // Perwakilan
                            pushname: "RAID PARTY",
                            item: "KEPALA NAGA IJO",
                            nominal: "PRICELESS",
                            status: "MENANG"
                        });
                    } catch(e) {}

                    await client.sendMessage(chatId, winMsg);
                    delete games[chatId];
                    return true;
                }

                // --- BOSS BALAS MENYERANG (Setiap user menyerang, Boss punya kesempatan 30% Counter Attack) ---
                // Biar game gak kelamaan nunggu giliran boss
                if (Math.random() < 0.4) {
                    await delay(1000);
                    // Boss serang target acak
                    const targetId = game.players[Math.floor(Math.random() * game.players.length)];
                    const target = game.stats[targetId];

                    if (!target.isDead) {
                        const bossDmg = game.boss.atk + Math.floor(Math.random() * 50);
                        target.hp -= bossDmg;

                        let bossTxt = `🔥 *SEMBURAN API!* Naga menyerang @${targetId.split('@')[0]} (-${bossDmg} HP)\nSisa HP: ${target.hp}/${target.maxHp}`;

                        if (target.hp <= 0) {
                            target.isDead = true;
                            target.hp = 0;
                            bossTxt += `\n💀 *PEMAIN TEWAS!*`;
                        }

                        await client.sendMessage(chatId, bossTxt, { mentions: [targetId] });
                    }
                }
                
                // Cek apakah semua pemain mati?
                const allDead = game.players.every(pid => game.stats[pid].isDead);
                if (allDead) {
                    await client.sendMessage(chatId, `☠️ *DEFEAT...* ☠️\n\nParty rata dengan tanah.\nNaga Ijo tersisa HP: ${game.boss.hp}`);
                    delete games[chatId];
                }
                
                return true;
            }

            // --- AKSI HEAL ---
            if (body === '!heal') {
                // Biaya 500 per heal
                if (uang.cekSaldo(senderId) < 500) return msg.reply('💸 Uang kurang! Butuh 500 buat beli potion.');
                
                uang.kurangSaldo(senderId, 500);
                const healAmount = 300;
                playerStat.hp += healAmount;
                if (playerStat.hp > playerStat.maxHp) playerStat.hp = playerStat.maxHp;

                await msg.reply(`💊 *GLUK GLUK...* HP pulih +${healAmount}.\nHP Sekarang: ${playerStat.hp}/${playerStat.maxHp}`);
                return true;
            }
        }

    } catch (err) {
        console.error('[ERROR GAME HANDLER]:', err);
    }


    // ==========================================
// 🐺 6. WEREWOLF HANDLER (NIGHT & VOTING)
// ==========================================
// 6A. FASE MALAM DI PRIVATE CHAT (PC)
if (!msg.from.includes('@g.us') && msg.body.toLowerCase().startsWith('!ww ')) {
    if (client.wwPlayersMap && client.wwPlayersMap[senderId]) {
        const grupId = client.wwPlayersMap[senderId];
        const game = client.wwGames[grupId];

        if (game && game.phase === 'night') {
            const myRoleData = game.rolesAssigned[senderId];
            if (!myRoleData || !myRoleData.isAlive || myRoleData.role === 'villager') return true;

            const targetIndex = parseInt(body.split(' ')[1]) - 1;
            if (isNaN(targetIndex) || !game.players[targetIndex]) {
                await msg.reply('❌ Nomor pemain tidak valid!');
                return true;
            }

            const targetId = game.players[targetIndex].id;
            if (!game.rolesAssigned[targetId].isAlive) {
                await msg.reply('❌ Target sudah mati!');
                return true;
            }

            if (myRoleData.role === 'werewolf') {
                game.nightActions['werewolf'] = targetId;
                await msg.reply(`🐺 Kamu memilih untuk membunuh ${game.players[targetIndex].name}.`);
            } else if (myRoleData.role === 'guard') {
                game.nightActions['guard'] = targetId;
                await msg.reply(`🛡️ Kamu melindungi ${game.players[targetIndex].name} malam ini.`);
            } else if (myRoleData.role === 'seer') {
                const targetRole = game.rolesAssigned[targetId].role;
                const roleName = targetRole === 'werewolf' ? 'JAHAT 🐺' : 'BAIK 🧑‍🌾';
                await msg.reply(`👁️ Hasil terawang: ${game.players[targetIndex].name} adalah orang yang *${roleName}*.`);
            }
            return true;
        }
    }
}

// 6B. FASE VOTING DI GRUP
if (msg.from.includes('@g.us') && msg.body.toLowerCase().startsWith('!ww vote ')) {
    if (client.wwGames && client.wwGames[msg.from]) {
        const game = client.wwGames[msg.from];
        if (game.phase !== 'voting') return true;
        
        const myRoleData = game.rolesAssigned[senderId];
        if (!myRoleData || !myRoleData.isAlive) {
            await msg.reply('💀 Orang mati dilarang voting!');
            return true;
        }

        const targetIndex = parseInt(body.split(' ')[2]) - 1;
        if (isNaN(targetIndex) || !game.players[targetIndex]) return true;

        const targetId = game.players[targetIndex].id;
        if (!game.rolesAssigned[targetId].isAlive) {
            await msg.reply('❌ Target sudah mati!');
            return true;
        }

        game.votes[senderId] = targetId;
        await msg.reply(`✅ Kamu mem-vote ${game.players[targetIndex].name}.`);

        // Hitung apakah semua yang hidup sudah vote
        const alivePlayers = Object.values(game.rolesAssigned).filter(p => p.isAlive).length;
        if (Object.keys(game.votes).length >= alivePlayers) {
            // Evaluasi Voting
            const voteCounts = {};
            for (let v in game.votes) {
                voteCounts[game.votes[v]] = (voteCounts[game.votes[v]] || 0) + 1;
            }

            // Cari vote terbanyak
            let maxVotes = 0;
            let executedId = null;
            for (let tId in voteCounts) {
                if (voteCounts[tId] > maxVotes) {
                    maxVotes = voteCounts[tId];
                    executedId = tId;
                }
            }

            let resultMsg = `⚖️ *VOTING SELESAI*\n\n`;
            if (executedId) {
                game.rolesAssigned[executedId].isAlive = false;
                resultMsg += `Warga telah sepakat! 💀 *${game.rolesAssigned[executedId].name}* dieksekusi mati.\n\n`;
            }

            // Cek kemenangan lagi
            const check = checkWin(game); // Anda perlu memastikan fungsi checkWin bisa diakses di sini, atau import.
            if (check) {
                resultMsg += check;
                await client.sendMessage(msg.from, resultMsg);
                delete client.wwGames[msg.from];
                return true;
            }

            await client.sendMessage(msg.from, resultMsg + `Malam akan segera tiba kembali...`);
            game.day += 1;
            setTimeout(() => {
                // Panggil ulang startNightPhase (Butuh direfaktorisasi agar fungsi bisa dipanggil lintas file)
                // Solusi: Anda bisa membuat event emitter atau memisahkan logika utama Werewolf ke sebuah file class terpisah.
            }, 3000);
        }
        return true;
    }
}

};