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
            return msg.reply('❌ Kamu gak punya *Pancingan*! Beli dulu di *!toko*.');
        }

        // 2. Cek Cooldown (Tetap 5 Detik)
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
        await msg.reply('🎣 *Melempar kail ke lautan luas...*');
        await new Promise(r => setTimeout(r, 1000));

        const chance = Math.random() * 100; // 0 - 100

        // SKENARIO 1: PANCINGAN PATAH (5%)
        if (chance < 5) {
            uang.useItem(userId, 'pancingan');
            return msg.reply('💥 *KRETEK!* Apes banget! Kailmu disambar monster laut dan pancinganmu PATAH.\n(Item hilang, beli lagi di toko).');
        }

        // SKENARIO 2: ZONK (15%)
        if (chance < 20) {
            const sampah = ['Sepatu Bot Butut', 'Ban Bekas', 'Plastik Kresek', 'Ranting Basah', 'Jaring Rusak'];
            const item = sampah[Math.floor(Math.random() * sampah.length)];
            return msg.reply(`👢 *ZONK!* Kamu cuma dapat *${item}*. Buang aja.`);
        }

        // SKENARIO 3: IKAN KONSUMSI / BIASA (50%) -> HARGA REALISTIS (Rp 25.000 - Rp 150.000)
        if (chance < 70) {
            const listIkan = ['Ikan Gurame Besar', 'Ikan Mas Koki', 'Ikan Kakap Merah', 'Ikan Kerapu', 'Ikan Bandeng', 'Cumi-Cumi Segar'];
            const ikan = listIkan[Math.floor(Math.random() * listIkan.length)];
            
            // Random antara 25.000 sampai 150.000
            const harga = Math.floor(Math.random() * 125000) + 25000; 

            uang.addSaldo(userId, harga, `Mancing: ${ikan}`);
            return msg.reply(`🐟 *LUMAYAN!* Dapat *${ikan}*.\nLangsung laku dijual di pasar ikan seharga: *${uang.formatRupiah(harga)}*`);
        }

        // SKENARIO 4: IKAN PREMIUM / LANGKA (25%) -> HARGA JUTAAN (Rp 800.000 - Rp 8.000.000)
        if (chance < 95) {
            const listIkan = ['Tuna Sirip Biru (Bluefin)', 'Arwana Super Red', 'Lobster Raksasa Mutiara', 'Kepiting Raja Alaska', 'Ikan Pari Manta Langka'];
            const ikan = listIkan[Math.floor(Math.random() * listIkan.length)];
            
            // Random antara 800.000 sampai 8.000.000
            const harga = Math.floor(Math.random() * 7200000) + 800000;

            uang.addSaldo(userId, harga, `Mancing Rare: ${ikan}`);
            return msg.reply(`🦈 *MANTAAP!* Tangkapan sultan! Kamu berhasil menarik *${ikan}*!\nKolektor berani bayar mahal: *${uang.formatRupiah(harga)}*`);
        }

        // SKENARIO 5: HARTA KARUN / LEGENDARY (5%) -> HARGA PULUHAN JUTA (Rp 15.000.000 - Rp 85.000.000)
        const listHarta = ['Peti Emas Peninggalan VOC', 'Mutiara Hitam Langka', 'Cincin Berlian Kuno', 'Bongkahan Emas Murni', 'Jam Tangan Rolex Tenggelam'];
        const harta = listHarta[Math.floor(Math.random() * listHarta.length)];
        
        // Random antara 15.000.000 sampai 85.000.000
        const harga = Math.floor(Math.random() * 70000000) + 15000000;

        uang.addSaldo(userId, harga, `Mancing Jackpot: ${harta}`);
        return msg.reply(`💎 *JACKPOT GILA!!!* Kailmu menyangkut sesuatu yang berat... Ternyata itu *${harta}*!\nKamu mendadak jadi miliarder setelah menjualnya seharga: *${uang.formatRupiah(harga)}* 🤑`);
    }
};