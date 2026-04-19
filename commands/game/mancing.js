const uang = require('../../utils/uang');
const levelSystem = require('../../utils/level');

const cdMancing = new Map();

// DATABASE PANCINGAN & PROBABILITAS
// Format: [Trash%, Common%, Uncommon%, Rare%, Epic%, Mythic%]
// Disusun dari TERMAHAL ke TERMURAH agar bot mendeteksi yang terbagus di tas duluan
const RODS = [
    { id: 'pancingan sultan kosmik', name: '🌌 Pancingan Sultan Kosmik', prob: [0, 0, 0, 20, 40, 40] },
    { id: 'pancingan naga laut', name: '🐉 Pancingan Naga Laut', prob: [0, 0, 10, 40, 30, 20] },
    { id: 'pancingan kristal', name: '💎 Pancingan Kristal', prob: [0, 0, 20, 45, 20, 15] },
    { id: 'pancingan poseidon', name: '🔱 Pancingan Poseidon', prob: [0, 0, 30, 40, 20, 10] },
    { id: 'pancingan elektro', name: '⚡ Pancingan Elektro', prob: [0, 5, 40, 35, 15, 5] },
    { id: 'pancingan titanium', name: '🛡️ Pancingan Titanium', prob: [0, 15, 45, 25, 12, 3] },
    { id: 'pancingan baja', name: '⚙️ Pancingan Baja', prob: [0, 25, 45, 20, 9, 1] },
    { id: 'pancingan karbon murni', name: '⚫ Pancingan Karbon Murni', prob: [0, 35, 40, 18, 7, 0] },
    { id: 'pancingan karbon', name: '🪨 Pancingan Karbon', prob: [0, 45, 35, 15, 5, 0] },
    { id: 'pancingan fiber pro', name: '🧵 Pancingan Fiber Pro', prob: [5, 50, 30, 12, 3, 0] },
    { id: 'pancingan fiber', name: '🧵 Pancingan Fiber', prob: [10, 55, 25, 9, 1, 0] },
    { id: 'pancingan paralon', name: '🚰 Pancingan Paralon', prob: [20, 55, 20, 5, 0, 0] },
    { id: 'pancingan kayu jati', name: '🪵 Pancingan Kayu Jati', prob: [30, 50, 18, 2, 0, 0] },
    { id: 'pancingan bambu', name: '🎋 Pancingan Bambu', prob: [45, 45, 10, 0, 0, 0] },
    { id: 'pancingan ranting', name: '🌱 Pancingan Ranting', prob: [60, 35, 5, 0, 0, 0] }
];

// DATABASE IKAN & TIER HARGA
const REWARDS = {
    0: [ // 0: Trash (Sampah)
        { nama: '👞 Sepatu Bolong', min: 100, max: 500 },
        { nama: '🌿 Kantong Plastik', min: 10, max: 100 },
        { nama: '🥫 Kaleng Karatan', min: 50, max: 200 }
    ],
    1: [ // 1: Common (Biasa)
        { nama: '🐟 Ikan Lele', min: 1000, max: 3000 },
        { nama: '🐟 Ikan Nila', min: 2000, max: 4000 },
        { nama: '🐟 Ikan Mujair', min: 1500, max: 5000 }
    ],
    2: [ // 2: Uncommon (Lumayan)
        { nama: '🐡 Ikan Buntal', min: 5000, max: 15000 },
        { nama: '🐠 Ikan Nemo', min: 8000, max: 20000 },
        { nama: '🦀 Kepiting Sawah', min: 10000, max: 20000 }
    ],
    3: [ // 3: Rare (Langka)
        { nama: '🦑 Cumi-Cumi Raksasa', min: 25000, max: 60000 },
        { nama: '🦞 Lobster Sultan', min: 40000, max: 80000 },
        { nama: '🦈 Anak Hiu Hitam', min: 50000, max: 100000 }
    ],
    4: [ // 4: Epic (Sangat Langka)
        { nama: '🐋 Paus Pembunuh', min: 150000, max: 350000 },
        { nama: '🦈 Hiu Megalodon', min: 200000, max: 450000 },
        { nama: '🐉 Ikan Arwana Raja', min: 250000, max: 500000 }
    ],
    5: [ // 5: Mythic (Legendaris / Harta)
        { nama: '🧜‍♀️ Putri Duyung Kesasar', min: 1000000, max: 2500000 },
        { nama: '👑 Mahkota Emas Atlantis', min: 2000000, max: 4000000 },
        { nama: '🏴‍☠️ Peti Harta Karun Bajak Laut', min: 3000000, max: 5000000 }
    ]
};

const getRand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    name: 'mancing',
    description: 'Mancing ikan dengan RPG style',
    type: 'game',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        
        // Cek Cooldown (3 Menit)
        const cooldownTime = 180000;
        if (cdMancing.has(userId)) {
            const timeLapse = Date.now() - cdMancing.get(userId);
            if (timeLapse < cooldownTime) {
                const sisa = Math.ceil((cooldownTime - timeLapse) / 1000);
                return msg.reply(`⏳ Lautan sedang tenang... Tunggu *${sisa} detik* lagi untuk melempar kail.`);
            }
        }

        // Cari Pancingan Terbaik di Inventory
        const inventory = uang.cekInventory(userId);
        let myRod = null;

        for (const rod of RODS) {
            if (inventory[rod.id] && inventory[rod.id] > 0) {
                myRod = rod;
                break; // Ambil yang paling atas (termahal), lalu stop
            }
        }

        if (!myRod) {
            return msg.reply('❌ Kamu belum punya alat pancing!\nKetik *!toko* lalu beli pancingan dulu (Contoh: *!beli pancingan ranting*).');
        }

        // Set Cooldown
        cdMancing.set(userId, Date.now());

        // Sistem Gacha (RNG) Kategori Hadiah
        const rand = Math.random() * 100;
        let cumulative = 0;
        let rarityTerpilih = 0;

        for (let i = 0; i < myRod.prob.length; i++) {
            cumulative += myRod.prob[i];
            if (rand <= cumulative) {
                rarityTerpilih = i;
                break;
            }
        }

        // Eksekusi Ikan & Uang
        const kategoriIkan = REWARDS[rarityTerpilih];
        const ikanDapat = kategoriIkan[Math.floor(Math.random() * kategoriIkan.length)];
        const uangDidapat = getRand(ikanDapat.min, ikanDapat.max);

        uang.addSaldo(userId, uangDidapat, `Hasil Jual ${ikanDapat.nama}`);
        levelSystem.addXp(userId); // Dikasih XP level juga

        // Bikin Emot Rarity
        const emoticons = ['⚪', '🟢', '🔵', '🟣', '🟡', '🔴 (MYTHIC)'];
        const emotRarity = emoticons[rarityTerpilih];

        const txt = `🎣 *MEMANCING MANIA* 🎣
Kamu melempar *${myRod.name}* ke laut...
        
*STRIIKKEE!!* 🌊
Kamu menarik kail dengan sekuat tenaga dan mendapatkan:
${emotRarity} *${ikanDapat.nama}*

Kamu langsung menjualnya ke pasar laut seharga:
💰 *${uang.formatRupiah(uangDidapat)}*

_Gunakan uangmu untuk upgrade pancingan di !toko_`;

        msg.reply(txt);
    }
};