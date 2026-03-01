const fs = require('fs');
const path = require('path');
const uang = require('../../utils/uang');

// Path untuk menyimpan data cooldown
const cdPath = path.join(__dirname, '../../data/mancingCD.json');

module.exports = {
    name: 'mancing',
    description: 'Mancing ikan cari duit (Butuh Pancingan)',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;

        // 1. Cek Apakah Punya Pancingan?
        const inventory = uang.cekInventory(userId);
        if (!inventory['pancingan'] || inventory['pancingan'] < 1) {
            return msg.reply('❌ Kamu gak punya *Pancingan*! Beli dulu di *!toko* seharga 25k.');
        }

        // 2. Cek Cooldown (Tetap 5 Detik biar cepat kaya)
        if (!fs.existsSync(cdPath)) fs.writeFileSync(cdPath, '{}');
        let cooldowns = {};
        try {
            cooldowns = JSON.parse(fs.readFileSync(cdPath));
        } catch (e) { cooldowns = {}; }
        
        const now = Date.now();
        const lastFish = cooldowns[userId] || 0;
        const cdTime = 5 * 1000; 

        if (now - lastFish < cdTime) {
            const sisaWaktu = Math.ceil((cdTime - (now - lastFish)) / 1000);
            return msg.reply(`⏳ Tunggu *${sisaWaktu} detik* lagi...`);
        }

        cooldowns[userId] = now;
        fs.writeFileSync(cdPath, JSON.stringify(cooldowns, null, 2));

        // 3. Proses Gacha (Visual Cepat 1 Detik)
        await msg.reply('🎣 *Melempar kail...*');
        await new Promise(r => setTimeout(r, 1000));

        const chance = Math.random() * 100; // 0 - 100

        // SKENARIO 1: PANCINGAN PATAH (5%)
        // Resiko tetap ada biar deg-degan, tapi kecil (1 dari 20 kali mancing)
        if (chance < 5) {
            uang.useItem(userId, 'pancingan');
            return msg.reply('💥 *KRETEK!* Apes banget! Pancinganmu nyangkut di batu dan PATAH.\n(Item hilang, beli lagi sana).');
        }

        // SKENARIO 2: ZONK (15%) - DIKURANGI BIAR GAK STRES
        if (chance < 20) {
            const sampah = ['Sepatu Butut', 'Popok Bayi', 'Kaleng Bekas', 'Ranting Pohon', 'Celana Dalam'];
            const item = sampah[Math.floor(Math.random() * sampah.length)];
            return msg.reply(`👢 *ZONK!* Kamu cuma dapat *${item}*. Buang aja.`);
        }

        // SKENARIO 3: IKAN BIASA (40%) - HARGA NAIK (3k - 8k)
        if (chance < 60) {
            const listIkan = ['Ikan Lele', 'Ikan Mas', 'Ikan Mujair', 'Ikan Nila', 'Ikan Sapu-sapu'];
            const ikan = listIkan[Math.floor(Math.random() * listIkan.length)];
            
            // Harga Baru: 3000 sampai 8000
            const harga = Math.floor(Math.random() * 5000) + 3000; 

            uang.addSaldo(userId, harga, `Mancing: ${ikan}`);
            return msg.reply(`🐟 *LUMAYAN!* Dapat *${ikan}*.\nLaku dijual: *${uang.formatRupiah(harga)}*`);
        }

        // SKENARIO 4: IKAN LANGKA (35%) - HARGA NAIK (10k - 25k) & CHANCE NAIK
        // Peluang dapat rare sekarang lebih besar (35%)
        if (chance < 95) {
            const listIkan = ['Ikan Hiu', 'Ikan Paus', 'Cumi Raksasa', 'Kepiting Raja', 'Arwana Golden', 'Lobster'];
            const ikan = listIkan[Math.floor(Math.random() * listIkan.length)];
            
            // Harga Baru: 10.000 sampai 25.000
            const harga = Math.floor(Math.random() * 15000) + 10000;

            uang.addSaldo(userId, harga, `Mancing Rare: ${ikan}`);
            return msg.reply(`🦈 *MANTAAP!* Tangkapan besar! Dapat *${ikan}*!\nBandar bayar mahal: *${uang.formatRupiah(harga)}*`);
        }

        // SKENARIO 5: LEGENDARY / HARTA KARUN (5%) - HARGA SULTAN (50k - 100k)
        const listHarta = ['Peti Emas', 'Mutiara Hitam', 'Kalung Berlian', 'Mahkota Raja', 'iPhone 15 Pro Max'];
        const harta = listHarta[Math.floor(Math.random() * listHarta.length)];
        
        // Harga Baru: 50.000 sampai 100.000
        const harga = Math.floor(Math.random() * 50000) + 50000;

        uang.addSaldo(userId, harga, `Mancing Jackpot: ${harta}`);
        return msg.reply(`💎 *JACKPOT GILA!!!* Kailmu menyangkut di *${harta}*!\nKamu mendadak kaya: *${uang.formatRupiah(harga)}*`);
    }
};