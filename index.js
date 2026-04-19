const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const printer = require('./utils/printer');
const activityTracker = require('./utils/activityTracker'); // Tracker aktivitas baru

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
        executablePath: '/usr/bin/chromium-browser', // Sesuaikan path ini jika di Ubuntu/Server
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
    // 📡 RADAR DETEKSI PESAN
    console.log(`[RADAR] Pesan dari: ${msg.from} | Isi: ${msg.body || '(Media/Sistem)'}`);

    try {
        if (msg.from === 'status@broadcast') return;
        if (msg.from.includes('@newsletter')) return;

        let chat;
        try { chat = await msg.getChat(); } catch (e) { return; }
        
        const contact = await msg.getContact();
        const body = msg.body || ''; 
        const senderId = contact.id._serialized; 
        const isOwner = config.ownerNumber === senderId || config.sudoUsers.includes(senderId);

        // ---------------------------------------------------------
        // ✅ PENCATATAN AKTIVITAS (Untuk Auto-Kick)
        // ---------------------------------------------------------
        if (chat.isGroup && !msg.fromMe) {
            await activityTracker.recordActivity(senderId, chat.id._serialized);
        }

        const settings = getCachedData().settings;

        // 🛡️ 1. CEK BLACKLIST PERMANEN
        const blacklist = getCachedData().blacklist;
        if (blacklist.includes(senderId)) {
            try { await msg.delete(true); } catch (e) {} 
            return; 
        }

        // 👮‍♂️ 2. SATPAM AFK & BLACKLIST SEMENTARA
        if (!msg.fromMe) {
            if (global.afkBlacklist.has(senderId)) {
                if (Date.now() < global.afkBlacklist.get(senderId)) {
                    try { await msg.delete(true); } catch (err) {}
                    return; 
                } else {
                    global.afkBlacklist.delete(senderId); 
                    global.afkWarnings.delete(senderId);
                }
            }

            if (global.afkMap.has(senderId)) {
                global.afkMap.delete(senderId);
                msg.reply(`👋 Selamat datang kembali! Status AFK kamu telah dicabut.`);
            }

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

                if (taggedAfkUser && taggedAfkUser.id !== senderId) {
                    let currentWarnings = global.afkWarnings.get(senderId) || 0;
                    currentWarnings += 1;
                    global.afkWarnings.set(senderId, currentWarnings);
                    const reason = taggedAfkUser.data.reason;

                    if (currentWarnings >= 3) {
                        const banDuration = 5 * 60 * 1000;
                        global.afkBlacklist.set(senderId, Date.now() + banDuration);
                        await msg.reply(`🚨 *HUKUMAN SISTEM*\nKamu tag/reply orang AFK 3x. Pesanmu akan dihapus otomatis selama 5 menit.`);
                        setTimeout(async () => {
                            global.afkBlacklist.delete(senderId);
                            global.afkWarnings.delete(senderId);
                            try {
                                await client.sendMessage(chat.id._serialized, `✅ @${contact.id.user}, hukuman AFK-mu berakhir.`, { mentions: [senderId] });
                            } catch (e) {}
                        }, banDuration);
                    } else {
                        return msg.reply(`⚠️ *PERINGATAN (${currentWarnings}/3)*\nJangan ganggu orang AFK! Alasan: ${reason}`);
                    }
                }
            }
        }

        // --- SISTEM LEVELING ---
        const lvlResult = levelSystem.addXp(senderId);
        if (lvlResult.leveledUp && lvlResult.announce) {
            msg.reply(`🎊 *LEVEL UP!* 🎊\n\nSelamat @${contact.id.user}, naik ke *Level ${lvlResult.level}*!`, { mentions: [senderId] });
        }

        // 🛑 4. MAINTENANCE MODE
        if (!settings.bot_active && body.toLowerCase() !== '!on' && !isOwner) return;

        // 💰 5. TOPUP OWNER
        if (isOwner && msg.hasQuotedMsg && body.toLowerCase().startsWith('ya ')) {
            const quotedMsg = await msg.getQuotedMessage();
            const content = quotedMsg.caption || quotedMsg.body || '';
            if (content.includes('REQUEST TOPUP')) {
                const nominal = parseInt(body.trim().split(/\s+/)[1]);
                const idMatch = content.match(/ID: (\S+)/);
                if (!isNaN(nominal) && idMatch) {
                    const targetId = idMatch[1];
                    uang.addSaldo(targetId, nominal, 'Topup via Owner');
                    await msg.reply(`✅ *DONE*\nMasuk: ${uang.formatRupiah(nominal)}`);
                    try {
                        printer.printStruk({ id: Date.now(), sender: targetId, pushname: "User", item: "TOPUP", nominal: uang.formatRupiah(nominal), status: "PAID" });
                    } catch (e) {}
                    return;
                }
            }
        }

        // 🎮 6. GAME HANDLER
        if (await gameHandler(client, msg)) return;

        // 🛡️ 7. KEAMANAN GRUP
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === senderId);
            const isSenderAdmin = participant ? (participant.isAdmin || participant.isSuperAdmin) : false;
            const botPart = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
            const isBotAdmin = botPart && (botPart.isAdmin || botPart.isSuperAdmin);

            if (!isSenderAdmin && !isOwner && isBotAdmin) {
                if (!settings.disabled_commands.includes('antivirtex') && body.length > 5000) {
                    await msg.delete(true);
                    await chat.removeParticipants([senderId]);
                    return;
                }
                const antilinkData = getCachedData().antilink;
                if (antilinkData.includes(chat.id._serialized) && body.includes('chat.whatsapp.com/')) {
                    await msg.delete(true);
                    return;
                }
                if (!settings.disabled_commands.includes('antikasar')) {
                    if (kataKasar.some(w => body.toLowerCase().includes(w))) {
                        await msg.delete(true);
                        return;
                    }
                }
            }
        }

        // 🤖 7.5 AUTO-BALAS AI
        const autoBalasUsers = getCachedData().autobalas;
        if (autoBalasUsers.includes(senderId) && !msg.fromMe) {
            try {
                await chat.sendStateTyping();
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'qwen2.5:1.5b', prompt: body, stream: false })
                });
                if (response.ok) {
                    const data = await response.json();
                    await msg.reply(data.response);
                }
                return;
            } catch (e) {}
        }

        // ⚙️ 8. COMMAND HANDLER
        if (!body.startsWith('!')) return;
        const args = body.slice(1).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        if (!client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);

        // 👑 PREMIUM CHECK
        const allowedDiPC = ['menu', 'daftarpremium', 'owner', 'premium'];
        if (!chat.isGroup && !isOwner && !allowedDiPC.includes(commandName)) {
            const limitStatus = premiumHandler.getLimitStatus(senderId, isOwner);
            if (limitStatus.status !== 'PREMIUM' && limitStatus.status !== 'OWNER') {
                return msg.reply(`⛔ Fitur PC khusus member *PREMIUM*.`);
            }
        }

        // Cek Admin Grup untuk perintah admin
        let isAdmin = false;
        if (chat.isGroup) {
            const p = chat.participants.find(p => p.id._serialized === senderId);
            isAdmin = p ? (p.isAdmin || p.isSuperAdmin) : false;
        }

        try {
            await command.execute(client, msg, args, { chat, contact, isOwner, isAdmin });
        } catch (err) {
            console.error(err);
        }

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
});

// ---------------------------------------------------------
// ✅ AUTO-KICK MEMBER TIDAK AKTIF (7 HARI)
// ---------------------------------------------------------
setInterval(async () => {
    console.log('🔍 [SISTEM] Pemindaian member hantu dimulai...');
    try {
        const inactiveUsers = await activityTracker.getInactiveMembers();
        for (const user of inactiveUsers) {
            try {
                const chat = await client.getChatById(user.group_id);
                const botPart = chat.participants.find(p => p.id._serialized === client.info.wid._serialized);
                
                if (botPart && (botPart.isAdmin || botPart.isSuperAdmin)) {
                    const participant = chat.participants.find(p => p.id._serialized === user.user_id);
                    if (!participant) {
                        await activityTracker.removeRecord(user.user_id, user.group_id);
                        continue;
                    }
                    
                    if (!participant.isAdmin && config.ownerNumber !== user.user_id) {
                        await chat.sendMessage(`👻 *AUTO-KICK*\n@${user.user_id.split('@')[0]} dikeluarkan karena tidak chat > 7 hari.`, { mentions: [user.user_id] });
                        await chat.removeParticipants([user.user_id]);
                        await activityTracker.removeRecord(user.user_id, user.group_id);
                    }
                }
            } catch (e) {
                await activityTracker.removeRecord(user.user_id, user.group_id);
            }
        }
    } catch (err) {
        console.error(err);
    }
}, 12 * 60 * 60 * 1000); // 12 Jam sekali

client.initialize();