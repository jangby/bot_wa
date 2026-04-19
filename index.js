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
global.afkWarnings = new Map();

// --- SISTEM CACHE (MENCEGAH BOT LEMOT BACA FILE) ---
const CACHE = {
    settings: { bot_active: true, disabled_commands: [] },
    blacklist: [],
    antilink: [],
    autobalas: [],
    lastFetch: 0
};

// Fungsi untuk menarik data tanpa membuat lag
const getCachedData = () => {
    const now = Date.now();
    // Update data dari file json setiap 30 detik saja, bukan setiap ada pesan masuk
    if (now - CACHE.lastFetch > 30000) { 
        try { CACHE.settings = fs.existsSync('./data/settings.json') ? JSON.parse(fs.readFileSync('./data/settings.json')) : CACHE.settings; } catch(e){}
        try { CACHE.blacklist = fs.existsSync('./data/blacklist.json') ? JSON.parse(fs.readFileSync('./data/blacklist.json')) : CACHE.blacklist; } catch(e){}
        try { CACHE.antilink = fs.existsSync('./data/antilink.json') ? JSON.parse(fs.readFileSync('./data/antilink.json')) : CACHE.antilink; } catch(e){}
        try { CACHE.autobalas = fs.existsSync('./data/autobalas.json') ? JSON.parse(fs.readFileSync('./data/autobalas.json')) : CACHE.autobalas; } catch(e){}
        CACHE.lastFetch = now;
    }
    return CACHE;
};

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
    // 📡 RADAR DETEKSI PESAN (Untuk memastikan bot tidak "tuli")
    console.log(`[RADAR] Pesan dari: ${msg.from} | Isi: ${msg.body || '(Media/Sistem)'}`);

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

        // Load Settings (Bot On/Off) Super Cepat dari Memori
        const settings = getCachedData().settings;

        // ==========================================
        // 🛡️ 1. CEK BLACKLIST PERMANEN (HAPUS PESAN & STOP)
        // ==========================================
        const blacklist = getCachedData().blacklist;
        if (blacklist.includes(senderId)) {
            try { await msg.delete(true); } catch (e) {} 
            return; 
        }

        // ==========================================
        // 👮‍♂️ 2. SATPAM AFK & BLACKLIST SEMENTARA
        // ==========================================
        if (!msg.fromMe) {
            
            // A. Cek Blacklist Sementara AFK (HUKUMAN: HAPUS PESAN AKTIF)
            if (global.afkBlacklist.has(senderId)) {
                if (Date.now() < global.afkBlacklist.get(senderId)) {
                    // Sedang dalam masa hukuman -> HAPUS PESANNYA
                    try {
                        await msg.delete(true); 
                    } catch (err) {
                        console.log('Gagal hapus pesan AFK, pastikan Bot adalah Admin Grup!');
                    }
                    return; // ⛔ STOP PROSES
                } else {
                    // Waktu habis tapi belum sempat terhapus oleh setTimeout (Fallback aman)
                    global.afkBlacklist.delete(senderId); 
                    global.afkWarnings.delete(senderId);
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

                // Deteksi Reply
                if (msg.hasQuotedMsg) {
                    const quoted = await msg.getQuotedMessage();
                    const quotedId = quoted.author || quoted.from;
                    if (global.afkMap.has(quotedId)) {
                        taggedAfkUser = { id: quotedId, data: global.afkMap.get(quotedId) };
                    }
                }

                // Deteksi Tag/Mention (@)
                if (!taggedAfkUser && msg.mentionedIds && msg.mentionedIds.length > 0) {
                    for (let id of msg.mentionedIds) {
                        if (global.afkMap.has(id)) {
                            taggedAfkUser = { id: id, data: global.afkMap.get(id) };
                            break;
                        }
                    }
                }

                // Jika terbukti melanggar (Tag/Reply orang AFK)
                if (taggedAfkUser && taggedAfkUser.id !== senderId) {
                    
                    // Ambil jumlah pelanggaran saat ini, tambah 1
                    let currentWarnings = global.afkWarnings.get(senderId) || 0;
                    currentWarnings += 1;
                    global.afkWarnings.set(senderId, currentWarnings);

                    const reason = taggedAfkUser.data.reason;

                    // CEK APAKAH SUDAH MENCAPAI 3 KALI PELANGGARAN
                    if (currentWarnings >= 3) {
                        const banDuration = 5 * 60 * 1000; // 5 Menit

                        // Masukkan ke blacklist
                        global.afkBlacklist.set(senderId, Date.now() + banDuration);
                        
                        // Kirim pesan eksekusi hukuman
                        await msg.reply(`🚨 *HUKUMAN SISTEM* 🚨\n\nKamu telah mengabaikan peringatan sebanyak 3 kali.\n\n_Semua pesan yang kamu kirim di grup ini akan otomatis dihapus oleh bot selama 5 menit ke depan!_`);

                        // Buat timer otomatis untuk mengabari jika hukuman selesai
                        setTimeout(async () => {
                            global.afkBlacklist.delete(senderId);
                            global.afkWarnings.delete(senderId); // Reset dosa jadi 0
                            
                            try {
                                await client.sendMessage(chat.id._serialized, `✅ @${contact.id.user}, masa hukuman AFK-mu telah berakhir. Kamu sudah bisa mengirim pesan lagi dengan normal.`, { mentions: [senderId] });
                            } catch (e) {}
                        }, banDuration);

                    } else {
                        // Jika masih 1 atau 2 kali pelanggaran, beri peringatan
                        return msg.reply(`⚠️ *PERINGATAN (${currentWarnings}/3)* ⚠️\n\nJangan tag atau balas pesan dia! Orang tersebut sedang AFK.\n*Alasan:* ${reason}\n\n_Peringatan ke-3 akan mengakibatkan pesanmu dibisukan otomatis selama 5 menit._`);
                    }
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

                        // Definisi Nama User
                        let namaUser = targetId; 
                        try {
                            const contactTarget = await client.getContactById(targetId);
                            if (contactTarget && contactTarget.pushname) {
                                namaUser = contactTarget.pushname;
                            }
                        } catch (e) {}

                        uang.addSaldo(targetId, nominal, 'Topup via Owner');
                        
                        await msg.reply(`✅ *DONE*\nMasuk: ${uang.formatRupiah(nominal)}`);
                        await client.sendMessage(targetId, `🎉 *TOPUP SUKSES*\nSaldo masuk: ${uang.formatRupiah(nominal)}`);

                        // 🔥 CETAK STRUK
                        try {
                            printer.printStruk({
                                id: Date.now(),
                                sender: targetId,
                                pushname: namaUser,      
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
                const antilinkData = getCachedData().antilink;
                if (antilinkData.includes(chat.id._serialized) && body.includes('chat.whatsapp.com/')) {
                    try {
                        await msg.delete(true);
                        await chat.sendMessage(`⚠️ @${contact.id.user} dilarang promosi link grup lain di sini!`, { mentions: [senderId] });
                    } catch (err) {
                        console.log('Gagal hapus link, pastikan bot adalah Admin');
                    }
                    return;
                }

                // Anti Kata Kasar
                if (!settings.disabled_commands.includes('antikasar')) {
                    const words = body.toLowerCase().split(/ +/);
                    if (words.some(w => kataKasar.includes(w))) {
                        await msg.delete(true);
                        return;
                    }
                }
            }
        }

        // ==========================================
        // 🤖 7.5 AUTO-BALAS AI HANDLER
        // ==========================================
        const autoBalasUsers = getCachedData().autobalas;
        
        // Jika pengirim ada di daftar auto-balas DAN pesannya bukan dari bot sendiri
        if (autoBalasUsers.includes(senderId) && !msg.fromMe) {
            try {
                await chat.sendStateTyping();

                const promptAI = `Kamu adalah teman ngobrol santai dari Indonesia. Bersikaplah sangat friendly, gaul, dan asik. Gunakan bahasa tongkrongan (seperti lo, gue, bro, sis, anjir, dll) tapi jangan kasar. Sesuaikan gaya bahasamu dengan chat lawan bicaramu. Balaslah chat berikut dengan natural dan seolah kamu manusia betulan:\n\n"${body}"`;

                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'qwen2.5:1.5b', 
                        prompt: promptAI,
                        stream: false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    await msg.reply(data.response);
                }
                return;
            } catch (error) {
                console.error('Auto-Balas Error:', error);
            }
        }

        // ==========================================
        // 🤖 7.6 AUTO-BALAS JIKA BOT DI-TAG (MENTION)
        // ==========================================
        if (chat.isGroup && !msg.fromMe && !body.startsWith('!')) {
            const botId = client.info.wid._serialized;
            const mentions = await msg.getMentions();
            
            const isBotMentioned = mentions.some(m => m.id._serialized === botId);

            if (isBotMentioned) {
                try {
                    await chat.sendStateTyping();

                    const botNumber = client.info.wid.user; 
                    const cleanMessage = body.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();

                    let senderName = "Member";
                    try { senderName = contact.pushname || contact.name || "Member"; } catch (e) {}

                    const promptAI = `Kamu adalah asisten virtual grup WhatsApp yang asik, ramah, dan gaul. Seseorang bernama ${senderName} baru saja me-mention/memanggilmu di grup dengan pesan berikut:\n\n"${cleanMessage}"\n\nBalaslah pesannya dengan natural. Gunakan bahasa Indonesia yang santai (lo-gue, bro, sis) tapi sopan. Jangan terlalu panjang:`;

                    const response = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen2.5:1.5b', 
                            prompt: promptAI,
                            stream: false
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        await msg.reply(data.response, chat.id._serialized, { mentions: [contact] });
                    }
                    return;
                } catch (error) {
                    console.error('Error saat merespon mention:', error);
                }
            }
        }

        // ==========================================
        // ⚙️ 8. COMMAND HANDLER (Prefix !)
        // ==========================================
        if (!body.startsWith('!')) return;

        const args = body.slice(1).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);

        // ==========================================
        // 👑 PINDAHAN CEK PREMIUM (GATEKEEPER PC)
        // ==========================================
        const allowedDiPC = ['menu', 'daftarpremium', 'owner', 'premium', 'ww', 'izinkan', 'tolak', 'rekapizin'];
        
        if (!chat.isGroup && !isOwner && command.type !== 'general' && !allowedDiPC.includes(commandName)) {
            // PERBAIKAN: Menggunakan fungsi MariaDB dari premiumHandler
            const limitStatus = premiumHandler.getLimitStatus(senderId, isOwner);
            
            if (limitStatus.status !== 'PREMIUM' && limitStatus.status !== 'OWNER') {
                return msg.reply(`⛔ *AKSES DITOLAK* ⛔\n\nFitur ini jika di Private Chat (PC) khusus member *PREMIUM*.\nKetik *!daftarpremium* untuk info berlangganan.`);
            }
        }

        // Cek Disable Fitur (Global)
        if (settings.disabled_commands.includes(commandName) && !isOwner) {
            return msg.reply('⚠️ Fitur ini sedang dimatikan Owner.');
        }

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