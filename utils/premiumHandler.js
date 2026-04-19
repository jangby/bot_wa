const db = require('./database'); // Panggil MariaDB
const uang = require('./uang');
const printer = require('./printer');

const DEFAULT_LIMIT = 5; 
const DEFAULT_PRICE = 5000; 

// ==========================================
// 🚀 SISTEM MEMORI RAM (SANGAT CEPAT)
// ==========================================
let dbPremium = {}; // { userId: expiredTimestamp }
let dbLimit = {};   // { userId: { limit: number, lastReset: timestamp } }
let dbConfig = {};  // { commandName: { limit: number, price: number } }

// 1. LOAD DATA DARI MARIADB SAAT BOT NYALA
const loadData = async () => {
    try {
        // Ambil data user
        const [users] = await db.query('SELECT user_id, premium_expired, daily_limit, limit_last_reset FROM users');
        users.forEach(u => {
            if (Number(u.premium_expired) > 0) dbPremium[u.user_id] = Number(u.premium_expired);
            if (Number(u.limit_last_reset) > 0) {
                dbLimit[u.user_id] = {
                    limit: Number(u.daily_limit),
                    lastReset: Number(u.limit_last_reset)
                };
            }
        });

        // Ambil data settingan fitur
        const [configs] = await db.query('SELECT command_name, daily_limit, price FROM feature_configs');
        configs.forEach(c => {
            dbConfig[c.command_name] = { limit: Number(c.daily_limit), price: Number(c.price) };
        });
        
        console.log('✅ Data Premium & Limit sukses dimuat dari MariaDB!');
    } catch (e) {
        console.error('❌ Gagal load Premium/Limit:', e.message);
    }
};
loadData();

// 2. AUTO-SAVE KE MARIADB TIAP 30 DETIK (TIDAK BIKIN LAG)
setInterval(async () => {
    try {
        // Simpan Data User (Hanya update kolom limit & premium agar tidak tabrakan dengan uang.js)
        const allUsers = new Set([...Object.keys(dbPremium), ...Object.keys(dbLimit)]);
        for (const userId of allUsers) {
            const expired = dbPremium[userId] || 0;
            const limitData = dbLimit[userId] || { limit: DEFAULT_LIMIT, lastReset: 0 };
            
            await db.query(
                'INSERT INTO users (user_id, premium_expired, daily_limit, limit_last_reset) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE premium_expired = ?, daily_limit = ?, limit_last_reset = ?',
                [userId, expired, limitData.limit, limitData.lastReset, expired, limitData.limit, limitData.lastReset]
            );
        }

        // Simpan Data Config Fitur
        for (const [cmd, data] of Object.entries(dbConfig)) {
            await db.query(
                'INSERT INTO feature_configs (command_name, daily_limit, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE daily_limit = ?, price = ?',
                [cmd, data.limit, data.price, data.limit, data.price]
            );
        }
    } catch (err) {
        // Abaikan error background agar terminal bersih
    }
}, 30000);


module.exports = {
    // 1. SETTING (Khusus Owner)
    setConfig: (commandName, limit, price) => {
        dbConfig[commandName] = {
            limit: parseInt(limit),
            price: parseInt(price)
        };
        return true;
    },

    // 2. BELI PREMIUM (Untuk User)
    buyPremium: (userId, commandName) => {
        let price = DEFAULT_PRICE;
        let duration = 24 * 60 * 60 * 1000; // 1 Hari
        
        if (commandName && dbConfig[commandName]) {
            price = dbConfig[commandName].price;
        }

        const saldo = uang.cekSaldo(userId);
        if (saldo < price) {
            return { 
                status: false, 
                msg: `💸 Saldo kurang! Harga Premium: *${uang.formatRupiah(price)}*.\nSaldomu: ${uang.formatRupiah(saldo)}` 
            };
        }

        uang.kurangSaldo(userId, price, `Beli Premium (${commandName || 'General'})`);
        
        const now = Date.now();
        let currentExp = dbPremium[userId] || now;
        if (currentExp < now) currentExp = now;
        
        const newExp = currentExp + duration;
        dbPremium[userId] = newExp; // Update instan di RAM
        
        // Cetak Struk (Berjalan di background)
        printer.printStruk({
            id: Date.now(),
            sender: userId,
            pushname: "User Premium",
            item: `PREMIUM ACCESS (${commandName || 'ALL'})`,
            nominal: uang.formatRupiah(price),
            status: "LUNAS"
        });

        return { 
            status: true, 
            msg: `✅ *PEMBELIAN BERHASIL*\n\nKamu sekarang User Premium!\n💰 Terpotong: ${uang.formatRupiah(price)}\n📅 Aktif sampai: ${new Date(newExp).toLocaleString('id-ID')}` 
        };
    },

    // 3. CEK LIMIT (Dieksekusi sangat cepat sebelum command jalan)
    checkLimit: async (client, msg, commandName, userId, isOwner) => {
        if (isOwner) return true;

        if (dbPremium[userId] && dbPremium[userId] > Date.now()) {
            return true; // Premium User = UNLIMITED
        }

        let limitPerHari = DEFAULT_LIMIT;
        if (dbConfig[commandName]) {
            limitPerHari = dbConfig[commandName].limit;
        }

        if (!dbLimit[userId]) {
            dbLimit[userId] = {
                limit: limitPerHari,
                lastReset: Date.now()
            };
        }

        let userLimit = dbLimit[userId];
        const now = Date.now();

        // Reset Harian
        const lastDate = new Date(userLimit.lastReset).getDate();
        const nowDate = new Date(now).getDate();

        if (lastDate !== nowDate) {
            userLimit.limit = limitPerHari; 
            userLimit.lastReset = now;
        }

        // Cek Sisa
        if (userLimit.limit <= 0) {
            let priceInfo = dbConfig[commandName] ? dbConfig[commandName].price : DEFAULT_PRICE;
            await msg.reply(`⛔ *LIMIT HABIS* ⛔\n\nKuota fitur *${commandName}* habis (${limitPerHari}x/hari).\n\n👑 *Buka Limit?*\nBeli Premium seharga: *${uang.formatRupiah(priceInfo)}*\nKetik: *!premium ${commandName}*`);
            return false;
        }

        userLimit.limit -= 1; // Potong limit di RAM
        return true;
    },

    getLimitStatus: (userId, isOwner) => {
        if (isOwner) return { status: 'OWNER', limit: '∞', max: '∞' };
        
        if (dbPremium[userId] && dbPremium[userId] > Date.now()) {
            return { status: 'PREMIUM', limit: '∞', max: '∞' };
        }

        let userLimit = dbLimit[userId];
        if (!userLimit) return { status: 'FREE', limit: DEFAULT_LIMIT, max: DEFAULT_LIMIT };
        
        return { status: 'FREE', limit: userLimit.limit, max: DEFAULT_LIMIT };
    }
};