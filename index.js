const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const printer = require('./utils/printer');

// --- IMPORTS SENJATA KITA ---
const config = require('./config');
const uang = require('./utils/uang');
const gameHandler = require('./utils/gameHandler');
const levelSystem = require('./utils/level');       // Logika Leveling
const premiumHandler = require('./utils/premiumHandler'); // Logika Limit & Premium

// Deklarasi memori untuk fitur AFK dan Blacklist sementara
global.afkMap = new Map();
global.afkBlacklist = new Map();

// --- INISIALISASI KATA KASAR ---
const kataKasar = ['anjing', 'babi', 'monyet', 'kunyuk', 'bajingan', 'tolol', 'goblok', 'bangsat', 'kontol', 'memek', 'jembut']; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        // ARAHKAN KE GOOGLE CHROME LAPTOP KAMU
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Load Commands Otomatis
client.commands = new Map();
const folders = ['general', 'fun', 'game', 'economy', 'admin', 'owner']; 
for (const folder of folders) {
    const folderPath = `./commands/${folder}`;
    if (fs.existsSync(folderPath)) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`${folderPath}/${file}`);
            client.commands.set(command.name, command);
        }
    }
}

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('📱 SCAN QR CODE DI ATAS SEKARANG!');
});

client.on('ready', () => {
    console.log('🤖 BOT SUDAH SIAP DAN ONLINE!');
});

// ==========================================
// 🔥 LOGIKA UTAMA (MESSAGE CREATE)
// ==========================================
client.on('message_create', async (msg) => {
    try {
        // 0. FILTER DASAR (Abaikan Status & Newsletter)
        if (msg.from === 'status@broadcast') return;
        if (msg.from.includes('@newsletter')) return;

        // Ambil Data Chat & Contact dengan Aman
        let chat;
        try { chat = await msg.getChat(); } catch (e) { return; }
        
        const contact = await msg.getContact();
        const body = msg.body || ''; // Fallback aman jika pesan berupa gambar tanpa caption
        const senderId = contact.id._serialized; // ID Pengirim (User)
        
        // Cek Owner (Berdasarkan config.js)
        const isOwner = config.ownerNumber === senderId || config.sudoUsers.includes(senderId);

        // Load Settings (Bot On/Off)
        const settingsPath = './data/settings.json';
        let settings = { bot_active: true, disabled_commands: [] };
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath));
        }

        // ==========================================
        // 🛡️ 1. CEK BLACKLIST PERMANEN (HAPUS PESAN & STOP)
        // ==========================================
        const blPath = path.join(__dirname, './data/blacklist.json');
        if (fs.existsSync(blPath)) {
            const blacklist = JSON.parse(fs.readFileSync(blPath));
            if (blacklist.includes(senderId)) {
                try { 
                    await msg.delete(true); 
                    console.log(`[BLACKLIST] Pesan dihapus dari: ${senderId}`);
                } catch (e) {} // Bot bukan admin, biarkan
                return; // ⛔ STOP PROSES
            }
        }

        // ==========================================
        // 👮‍♂️ 2. SATPAM AFK & BLACKLIST SEMENTARA
        // ==========================================
        // Kita abaikan pesan dari bot itu sendiri agar tidak terjadi looping
        if (!msg.fromMe) {
            
            // A. Cek Blacklist Sementara AFK (5 Menit)
            if (global.afkBlacklist.has(senderId)) {
                if (Date.now() < global.afkBlacklist.get(senderId)) {
                    return; // ⛔ STOP PROSES (Pura-pura mati buat dia)
                } else {
                    global.afkBlacklist.delete(senderId); // Waktu habis, bebas!
                }
            }

            // B. Cabut status AFK jika orang tersebut mengirim pesan
            if (global.afkMap.has(senderId)) {
                global.afkMap.delete(senderId);
                msg.reply(`👋 Selamat datang kembali! Status AFK kamu telah dicabut.`);
            }

            // C. Cek Pelanggaran: Apakah dia tag/reply orang yang sedang AFK?
            if (chat.isGroup) {
                let taggedAfkUser = null;

                if (msg.hasQuotedMsg) {
                    const quoted = await msg.getQuotedMessage();
                    const quotedId = quoted.author || quoted.from;
                    if (global.afkMap.has(quotedId)) {
                        taggedAfkUser = { id: quotedId, data: global.afkMap.get(quotedId) };
                    }
                }

                if (!taggedAfkUser && msg.mentionedIds && msg.mentionedIds.length > 0) {
                    for (let id of msg.mentionedIds) {
                        if (global.afkMap.has(id)) {
                            taggedAfkUser = { id: id, data: global.afkMap.get(id) };
                            break;
                        }
                    }
                }

                // Jika terbukti melanggar
                if (taggedAfkUser && taggedAfkUser.id !== senderId) {
                    // Masukkan ke blacklist 5 menit
                    global.afkBlacklist.set(senderId, Date.now() + (5 * 60 * 1000));
                    return msg.reply(`⚠️ *PERINGATAN SISTEM* ⚠️\n\nJangan tag atau balas pesan dia! Orang tersebut sedang AFK.\n*Alasan:* ${taggedAfkUser.data.reason}\n\n🚨 _HUKUMAN: Kamu di-blacklist. Bot tidak akan merespons pesanmu selama 5 menit!_`);
                }
            }
        }

        // ==========================================
        // 🛑 4. CEK BOT MATI (Maintenance Mode)
        // ==========================================
        if (!settings.bot_active && body.toLowerCase() !== '!on' && !isOwner) return;

        // ==========================================
        // 💰 5. LOGIKA TOPUP OWNER (Manual ACC)
        // ==========================================
        if (isOwner && msg.hasQuotedMsg && body.toLowerCase().startsWith('ya ')) {
            const quotedMsg = await msg.getQuotedMessage();
            const content = quotedMsg.caption || quotedMsg.body || '';

            if (content.includes('REQUEST TOPUP') && content.includes('ID:')) {
                const argsTopup = body.trim().split(/\s+/);
                const nominal = parseInt(argsTopup[1]);

                if (!isNaN(nominal)) {
                    const idMatch = content.match(/ID: (\S+)/);
                    if (idMatch && idMatch[1]) {
                        const targetId = idMatch[1];

                        // --- PERBAIKAN DI SINI (DEFINISI NAMA USER) ---
                        let namaUser = targetId; // Default pakai nomor HP dulu
                        try {
                            // Coba ambil nama asli dari kontak WA
                            const contactTarget = await client.getContactById(targetId);
                            if (contactTarget && contactTarget.pushname) {
                                namaUser = contactTarget.pushname;
                            }
                        } catch (e) {
                            // Kalau gagal ambil nama, biarkan tetap nomor HP
                        }
                        // ----------------------------------------------

                        const saldoBaru = uang.addSaldo(targetId, nominal, 'Topup via Owner');
                        
                        await msg.reply(`✅ *DONE*\nMasuk: ${uang.formatRupiah(nominal)}`);
                        await client.sendMessage(targetId, `🎉 *TOPUP SUKSES*\nSaldo masuk: ${uang.formatRupiah(nominal)}`);

                        // 🔥 CETAK STRUK (Sekarang aman karena namaUser sudah ada)
                        try {
                            const printer = require('./utils/printer'); // Pastikan path benar
                            printer.printStruk({
                                id: Date.now(),
                                sender: targetId,
                                pushname: namaUser,      // <--- Tidak error lagi
                                item: "TOPUP SALDO BOT",
                                nominal: uang.formatRupiah(nominal),
                                status: "LUNAS / PAID"
                            });
                        } catch (errPrint) {
                            console.log('Gagal Print:', errPrint.message);
                        }

                        return;
                    }
                }
            }
        }

        // ==========================================
        // 🎮 6. GAME HANDLER (Kuis, TTT, Adu Ayam)
        // ==========================================
        // Handle input game (tanpa prefix !)
        if (await gameHandler(client, msg)) return;

        // ==========================================
        // 🛡️ 7. KEAMANAN GRUP (Anti-Link, Virtex, Kasar)
        // ==========================================
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === senderId);
            const isSenderAdmin = participant ? (participant.isAdmin || participant.isSuperAdmin) : false;
            
            const botId = client.info.wid._serialized;
            const botPart = chat.participants.find(p => p.id._serialized === botId);
            const isBotAdmin = botPart && (botPart.isAdmin || botPart.isSuperAdmin);

            // Jika Pengirim BUKAN Admin & BUKAN Owner, tapi Bot ADMIN
            if (!isSenderAdmin && !isOwner && isBotAdmin) {
                
                // Anti Virtex
                if (!settings.disabled_commands.includes('antivirtex') && body.length > 5000) {
                    await msg.delete(true);
                    await chat.removeParticipants([senderId]);
                    return;
                }
                
                // Anti Link Grup WA
                if (!settings.disabled_commands.includes('antilink') && body.includes('chat.whatsapp.com/')) {
                    await msg.delete(true);
                    await chat.sendMessage(`⚠️ @${contact.id.user} dilarang kirim link grup!`, { mentions: [senderId] });
                    return;
                }

                // Anti Kata Kasar
                if (!settings.disabled_commands.includes('antikasar')) {
                    const words = body.toLowerCase().split(/ +/);
                    if (words.some(w => kataKasar.includes(w))) {
                        await msg.delete(true);
                        // await chat.sendMessage(`⚠️ Jaga lisanmu @${contact.id.user}!`, { mentions: [senderId] });
                        return;
                    }
                }
            }
        }

        // ==========================================
        // 🤖 7.5 AUTO-BALAS AI HANDLER
        // ==========================================
        const autoBalasPath = path.join(__dirname, './data/autobalas.json');
        if (fs.existsSync(autoBalasPath) && !body.startsWith('!')) {
            const autoBalasUsers = JSON.parse(fs.readFileSync(autoBalasPath));
            
            // Jika pengirim ada di daftar auto-balas DAN pesannya bukan dari bot sendiri
            if (autoBalasUsers.includes(senderId) && !msg.fromMe) {
                try {
                    // Beri status "typing..." agar terlihat seperti manusia betulan
                    await chat.sendStateTyping();

                    // Instruksi untuk Ollama agar menjadi gaul dan friendly
                    const promptAI = `Kamu adalah teman ngobrol santai dari Indonesia. Bersikaplah sangat friendly, gaul, dan asik. Gunakan bahasa tongkrongan (seperti lo, gue, bro, sis, anjir, dll) tapi jangan kasar. Sesuaikan gaya bahasamu dengan chat lawan bicaramu. Balaslah chat berikut dengan natural dan seolah kamu manusia betulan:\n\n"${body}"`;

                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen2.5:1.5b', // Sesuaikan dengan modelmu
                            prompt: promptAI,
                            stream: false
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        await msg.reply(data.response);
                    }
                    return; // ⛔ PENTING: Stop di sini agar chat biasa tidak error saat masuk ke Command Handler bawahnya
                } catch (error) {
                    console.error('Auto-Balas Error:', error);
                }
            }
        }

        // ==========================================
        // 🤖 7.6 AUTO-BALAS JIKA BOT DI-TAG (MENTION)
        // ==========================================
        if (chat.isGroup && !msg.fromMe && !body.startsWith('!')) {
            const botId = client.info.wid._serialized;
            const mentions = await msg.getMentions();
            
            // Cek apakah di antara orang yang di-tag, ada ID bot kita
            const isBotMentioned = mentions.some(m => m.id._serialized === botId);

            if (isBotMentioned) {
                try {
                    // Biar kelihatan seperti manusia ngetik
                    await chat.sendStateTyping();

                    // Bersihkan teks dari tag bot agar AI fokus pada pertanyaannya
                    // Contoh: "@628... halo bot" -> "halo bot"
                    const botNumber = client.info.wid.user; 
                    const cleanMessage = body.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();

                    // Coba ambil nama pengirim
                    let senderName = "Member";
                    try { senderName = contact.pushname || contact.name || "Member"; } catch (e) {}

                    // Instruksi untuk Qwen
                    const promptAI = `Kamu adalah asisten virtual grup WhatsApp yang asik, ramah, dan gaul. Seseorang bernama ${senderName} baru saja me-mention/memanggilmu di grup dengan pesan berikut:\n\n"${cleanMessage}"\n\nBalaslah pesannya dengan natural. Gunakan bahasa Indonesia yang santai (lo-gue, bro, sis) tapi sopan. Jangan terlalu panjang:`;

                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen2.5:1.5b', // Kita pakai Qwen biar cepat dan pintar bahasa lokal
                            prompt: promptAI,
                            stream: false
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Balas pesan dan mention balik orang yang manggil
                        await msg.reply(data.response, chat.id._serialized, { mentions: [contact] });
                    }
                    return; // ⛔ STOP di sini agar tidak tabrakan dengan proses lain
                } catch (error) {
                    console.error('Error saat merespon mention:', error);
                }
            }
        }

        // ==========================================
        // ⚙️ 8. COMMAND HANDLER (Prefix !)
        // ==========================================
        if (!body.startsWith('!')) return; // Hanya respon yg depannya !

        const args = body.slice(1).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands.has(commandName)) return; // Command gak dikenal

        const command = client.commands.get(commandName);

        // ==========================================
        // 👑 PINDAHAN CEK PREMIUM (GATEKEEPER PC)
        // ==========================================
        // Jika chat di PC, bukan Owner, dan fitur tersebut BUKAN bertipe 'general'
        const allowedDiPC = ['menu', 'daftarpremium', 'owner', 'premium', 'ww', 'izinkan', 'tolak', 'rekapizin'];
        
        if (!chat.isGroup && !isOwner && command.type !== 'general' && !allowedDiPC.includes(commandName)) {
            const premPath = path.join(__dirname, './data/premium.json');
            let isPremium = false;
            
            if (fs.existsSync(premPath)) {
                const premiumUsers = JSON.parse(fs.readFileSync(premPath));
                const expDate = premiumUsers[senderId];
                if (expDate && expDate > Date.now()) isPremium = true;
            }

            if (!isPremium) {
                return msg.reply(`⛔ *AKSES DITOLAK* ⛔\n\nFitur ini jika di Private Chat (PC) khusus member *PREMIUM*.\nKetik *!daftarpremium* untuk info berlangganan.`);
            }
        }

        // Cek Disable Fitur (Global)
        if (settings.disabled_commands.includes(commandName) && !isOwner) {
            return msg.reply('⚠️ Fitur ini sedang dimatikan Owner.');
        }

        // ==========================================
        // 🛑 SISTEM LIMIT & PREMIUM (PERBAIKAN)
        // ==========================================
        // Command yang GRATIS (Tidak kurangi limit)
        const freeCommands = ['menu', 'daftarpremium', 'owner', 'ceklimit', 'topup', 'addpremium', 'on', 'off', 'daftar', 'help'];
        
        if (!freeCommands.includes(commandName)) {
            const canProceed = await premiumHandler.checkLimit(client, msg, commandName, senderId, isOwner);
            if (!canProceed) return; 
        }

        // ==========================================

        // Cek Admin Grup
        let isAdmin = false;
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === senderId);
            isAdmin = participant ? (participant.isAdmin || participant.isSuperAdmin) : false;
        }

        // Eksekusi Command
        try {
            await command.execute(client, msg, args, { chat, contact, isOwner, isAdmin });
        } catch (err) {
            console.error(`Error execute ${commandName}:`, err);
            msg.reply('❌ Terjadi kesalahan pada sistem bot.');
        }

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
});

client.initialize();
