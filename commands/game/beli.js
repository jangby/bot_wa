const uang = require('../../utils/uang');
const levelSystem = require('../../utils/level');

const DAFTAR_BARANG = {
    // ITEM BAWAAN KAMU (Level 0)
    'tuyul': { harga: 50000, minLevel: 0 },
    'petir': { harga: 50000, minLevel: 0 },
    'bom': { harga: 75000, minLevel: 0 },
    'perisai': { harga: 100000, minLevel: 0 },
    'celengan': { harga: 15000, minLevel: 0 },
    'kartu': { harga: 30000, minLevel: 0 },
    'kotak': { harga: 10000, minLevel: 0 },
    'surat': { harga: 10000, minLevel: 0 },
    'speaker': { harga: 5000, minLevel: 0 },
    'kacamata': { harga: 100000, minLevel: 0 },
    'sapu': { harga: 75000, minLevel: 0 },
    'obat': { harga: 20000, minLevel: 0 },
    'cincin': { harga: 500000, minLevel: 0 },

    // 15 PANCINGAN RPG BARU
    'pancingan ranting': { harga: 5000, minLevel: 1 },
    'pancingan bambu': { harga: 10000, minLevel: 3 },
    'pancingan kayu jati': { harga: 25000, minLevel: 5 },
    'pancingan paralon': { harga: 50000, minLevel: 10 },
    'pancingan fiber': { harga: 100000, minLevel: 15 },
    'pancingan fiber pro': { harga: 250000, minLevel: 20 },
    'pancingan karbon': { harga: 500000, minLevel: 25 },
    'pancingan karbon murni': { harga: 1000000, minLevel: 30 }, 
    'pancingan baja': { harga: 2500000, minLevel: 40 }, 
    'pancingan titanium': { harga: 5000000, minLevel: 50 }, 
    'pancingan elektro': { harga: 10000000, minLevel: 60 }, 
    'pancingan poseidon': { harga: 25000000, minLevel: 70 }, 
    'pancingan kristal': { harga: 50000000, minLevel: 80 }, 
    'pancingan naga laut': { harga: 100000000, minLevel: 90 }, 
    'pancingan sultan kosmik': { harga: 500000000, minLevel: 100 } 
};

module.exports = {
    name: 'beli',
    description: 'Beli barang dari toko',
    type: 'game',
    async execute(client, msg, args, { contact }) {
        if (args.length === 0) return msg.reply('⚠️ Format salah! Ketik: *!beli [nama barang] [jumlah]*\nContoh: *!beli bom 2* atau *!beli pancingan fiber*');

        const userId = contact.id._serialized;
        
        // Deteksi Jumlah Pembelian di kata terakhir (Contoh: "bom 3" -> qty 3)
        let qty = 1;
        let itemName = args.join(' ').toLowerCase();

        if (args.length > 1 && !isNaN(args[args.length - 1])) {
            qty = parseInt(args[args.length - 1]);
            if (qty < 1) qty = 1;
            itemName = args.slice(0, -1).join(' ').toLowerCase(); // Buang angka dari nama
        }

        // Cek apakah barang ada di toko
        if (!DAFTAR_BARANG[itemName]) {
            return msg.reply('❌ Barang tidak ditemukan di toko. Pastikan tulisan sesuai dengan di *!toko*.');
        }

        const barang = DAFTAR_BARANG[itemName];
        const userLevelData = levelSystem.getUser(userId);

        // Cek Syarat Level
        if (userLevelData.level < barang.minLevel) {
            return msg.reply(`⛔ Level kamu belum cukup!\nLevel Kamu: ${userLevelData.level}\nSyarat Level Alat: ${barang.minLevel}`);
        }

        const totalHarga = barang.harga * qty;

        // Proses Pembayaran
        const suksesBeli = uang.kurangSaldo(userId, totalHarga, `Beli ${itemName} x${qty}`);
        if (!suksesBeli) {
            return msg.reply(`💸 Uangmu tidak cukup! Harga total untuk *${qty}x ${itemName}* adalah ${uang.formatRupiah(totalHarga)}.`);
        }

        // Masukkan ke Inventory
        uang.addItem(userId, itemName, qty);
        
        msg.reply(`🛍️ *PEMBELIAN SUKSES*\nKamu membeli *${qty}x ${itemName.toUpperCase()}* seharga ${uang.formatRupiah(totalHarga)}.\nCek di *!saldo*.`);
    }
};