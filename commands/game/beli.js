const uang = require('../../utils/uang');

// DAFTAR HARGA BARU (Total 14 Item)
const hargaBarang = {
    // Item Lama
    'tuyul': 50000,
    'surat': 10000,
    'perisai': 100000,
    'bom': 75000,
    
    // Item Baru
    'pancingan': 25000,
    'petir': 50000,
    'celengan': 15000,
    'kartu': 30000, // Kartu Bebas Penjara
    'kotak': 10000, // Kotak Misteri
    'speaker': 5000,
    'sapu': 75000,
    'kacamata': 100000,
    'obat': 20000,
    'cincin': 500000
};

module.exports = {
    name: 'beli',
    description: 'Membeli barang dari toko',
    async execute(client, msg, args, { contact }) {
        // ... (Kode bawahnya SAMA PERSIS dengan sebelumnya, tidak perlu diubah) ...
        if (args.length < 1) return msg.reply('❌ Mau beli apa? Cek *!toko* dulu.');

        const item = args[0].toLowerCase();
        const jumlah = parseInt(args[1]) || 1; 

        if (!hargaBarang[item]) return msg.reply('❌ Barang tidak dijual di toko ini!');
        if (jumlah < 1) return msg.reply('❌ Jumlah tidak valid.');

        const totalHarga = hargaBarang[item] * jumlah;
        const userId = contact.id._serialized;

        if (uang.cekSaldo(userId) < totalHarga) {
            return msg.reply(`💸 Uangmu kurang! Total: ${uang.formatRupiah(totalHarga)}\nSaldo: ${uang.formatRupiah(uang.cekSaldo(userId))}`);
        }

        uang.kurangSaldo(userId, totalHarga);
        uang.addItem(userId, item, jumlah);

        msg.reply(`✅ *PEMBELIAN BERHASIL*\n\n📦 Barang: ${item.toUpperCase()}\n🔢 Jumlah: ${jumlah}\n💰 Total: ${uang.formatRupiah(totalHarga)}\n\nCek tas kamu di *!saldo*`);
    }
};