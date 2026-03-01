const fs = require('fs');
const path = require('path');
const uang = require('./uang');
const printer = require('./printer');

const premPath = path.join(__dirname, '../data/premium.json');
const limitPath = path.join(__dirname, '../data/limit.json');
const configPath = path.join(__dirname, '../data/featureConfig.json'); // Database baru untuk harga/limit per fitur

// Default Setting jika belum diatur Owner
const DEFAULT_LIMIT = 5; 
const DEFAULT_PRICE = 5000; // Harga default premium

// Helper Load/Save
const loadJson = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
    return JSON.parse(fs.readFileSync(filePath));
};
const saveJson = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

module.exports = {
    // 1. SETTING (Khusus Owner)
    setConfig: (commandName, limit, price) => {
        let config = loadJson(configPath);
        
        config[commandName] = {
            limit: parseInt(limit),
            price: parseInt(price)
        };
        
        saveJson(configPath, config);
        return true;
    },

    // 2. BELI PREMIUM (Untuk User)
    buyPremium: (userId, commandName) => {
        let config = loadJson(configPath);
        let premiumUsers = loadJson(premPath);
        
        // Cek Harga (Ambil dari config fitur, atau pakai harga default)
        // Jika user ketik !premium tanpa nama fitur, pakai harga default
        let price = DEFAULT_PRICE;
        let duration = 24 * 60 * 60 * 1000; // 1 Hari (Default)
        
        if (commandName && config[commandName]) {
            price = config[commandName].price;
            // Asumsi: Harga yang diatur owner adalah harga untuk 1 Hari Premium
        }

        // Cek Saldo User
        const saldo = uang.cekSaldo(userId);
        if (saldo < price) {
            return { 
                status: false, 
                msg: `💸 Saldo kurang! Harga Premium: *${uang.formatRupiah(price)}*.\nSaldomu: ${uang.formatRupiah(saldo)}` 
            };
        }

        // Proses Transaksi
        uang.kurangSaldo(userId, price, `Beli Premium (${commandName || 'General'})`);
        
        // Tambah Durasi Premium
        const now = Date.now();
        let currentExp = premiumUsers[userId] || now;
        if (currentExp < now) currentExp = now;
        
        const newExp = currentExp + duration;
        premiumUsers[userId] = newExp;
        
        saveJson(premPath, premiumUsers);

        // 🔥 CETAK STRUK 🔥
// Kita panggil fungsi print (async, tapi jangan ditunggu await biar gak lemot)
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

    // 3. CEK LIMIT (Dipakai di index.js)
    checkLimit: async (client, msg, commandName, userId, isOwner) => {
        if (isOwner) return true;

        // Cek Premium
        let premiumUsers = loadJson(premPath);
        if (premiumUsers[userId] && premiumUsers[userId] > Date.now()) {
            return true; // Premium User = UNLIMITED
        }

        // Cek Config Khusus (Jika owner mengatur limit khusus untuk fitur ini)
        let featureConfig = loadJson(configPath);
        let limitPerHari = DEFAULT_LIMIT;

        if (featureConfig[commandName]) {
            limitPerHari = featureConfig[commandName].limit;
        }

        // Load Database Limit User
        let limitDb = loadJson(limitPath);

        if (!limitDb[userId]) {
            limitDb[userId] = {
                limit: limitPerHari,
                lastReset: Date.now()
            };
        }

        let userLimit = limitDb[userId];
        const now = Date.now();

        // Reset Harian
        const lastDate = new Date(userLimit.lastReset).getDate();
        const nowDate = new Date(now).getDate();

        if (lastDate !== nowDate) {
            userLimit.limit = limitPerHari; // Reset
            userLimit.lastReset = now;
        }

        // Cek Sisa
        if (userLimit.limit <= 0) {
            let priceInfo = featureConfig[commandName] ? featureConfig[commandName].price : DEFAULT_PRICE;
            await msg.reply(`⛔ *LIMIT HABIS* ⛔\n\nKuota fitur *${commandName}* habis (${limitPerHari}x/hari).\n\n👑 *Buka Limit?*\nBeli Premium seharga: *${uang.formatRupiah(priceInfo)}*\nKetik: *!premium ${commandName}*`);
            return false;
        }

        userLimit.limit -= 1;
        saveJson(limitPath, limitDb);
        return true;
    },

    getLimitStatus: (userId, isOwner) => {
        if (isOwner) return { status: 'OWNER', limit: '∞', max: '∞' };
        
        let premiumUsers = loadJson(premPath);
        if (premiumUsers[userId] && premiumUsers[userId] > Date.now()) {
            return { status: 'PREMIUM', limit: '∞', max: '∞' };
        }

        let limitDb = loadJson(limitPath);
        let userLimit = limitDb[userId];
        if (!userLimit) return { status: 'FREE', limit: DEFAULT_LIMIT, max: DEFAULT_LIMIT };
        
        return { status: 'FREE', limit: userLimit.limit, max: DEFAULT_LIMIT };
    }
};