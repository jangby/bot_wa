const fs = require('fs');
const path = require('path');

// Path Database
const dbPath = path.join(__dirname, '../data/uang.json');
const invPath = path.join(__dirname, '../data/inventory.json');
const mutasiPath = path.join(__dirname, '../data/mutasi.json');

// 1. KITA LOAD DATA SEKALI SAJA SAAT BOT BARU NYALA
let dbUang = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
let dbInv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath)) : {};
let dbMutasi = fs.existsSync(mutasiPath) ? JSON.parse(fs.readFileSync(mutasiPath)) : {};

// 2. SISTEM AUTO-SAVE (MENCEGAH LAG)
// Bot akan menyimpan perubahan ke file JSON setiap 30 detik di latar belakang
setInterval(() => {
    fs.writeFileSync(dbPath, JSON.stringify(dbUang, null, 2));
    fs.writeFileSync(invPath, JSON.stringify(dbInv, null, 2));
    fs.writeFileSync(mutasiPath, JSON.stringify(dbMutasi, null, 2));
}, 30000); // 30000 ms = 30 detik

// Fungsi Format Rupiah
const formatRupiah = (angka) => {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Fungsi Mencatat Mutasi
const catatMutasi = (userId, tipe, nominal, keterangan) => {
    if (!dbMutasi[userId]) dbMutasi[userId] = [];

    // Tambah ke memori, bukan ke file
    dbMutasi[userId].unshift({
        date: new Date().toLocaleString('id-ID'),
        type: tipe,
        amount: formatRupiah(nominal),
        desc: keterangan || 'Transaksi Tanpa Keterangan'
    });

    if (dbMutasi[userId].length > 50) dbMutasi[userId].pop();
};

module.exports = {
    formatRupiah,

    // Cek Saldo (Sangat Cepat karena ambil dari memori)
    cekSaldo: (userId) => {
        return dbUang[userId] || 0;
    },

    // Tambah Saldo
    addSaldo: (userId, amount, keterangan = 'Pendapatan Lain-lain') => {
        const saldoAwal = dbUang[userId] || 0;
        dbUang[userId] = saldoAwal + amount; // Cuma ubah di memori
        catatMutasi(userId, 'MASUK 🟢', amount, keterangan);
        return dbUang[userId];
    },

    // Kurang Saldo
    kurangSaldo: (userId, amount, keterangan = 'Pembelian/Denda') => {
        const saldoAwal = dbUang[userId] || 0;
        if (saldoAwal < amount) return false; 

        dbUang[userId] = saldoAwal - amount; // Cuma ubah di memori
        catatMutasi(userId, 'KELUAR 🔴', amount, keterangan);
        return true;
    },

    // Cek Inventory
    cekInventory: (userId) => {
        return dbInv[userId] || {};
    },

    // Tambah Item
    addItem: (userId, itemName, amount = 1) => {
        if (!dbInv[userId]) dbInv[userId] = {};
        if (!dbInv[userId][itemName]) dbInv[userId][itemName] = 0;
        dbInv[userId][itemName] += amount;
    },

    // Pakai Item
    useItem: (userId, itemName) => {
        if (!dbInv[userId] || !dbInv[userId][itemName] || dbInv[userId][itemName] < 1) return false;
        dbInv[userId][itemName] -= 1;
        if (dbInv[userId][itemName] === 0) delete dbInv[userId][itemName];
        return true;
    }
};