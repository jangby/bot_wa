const fs = require('fs');
const path = require('path');

// Path Database
const dbPath = path.join(__dirname, '../data/uang.json');
const invPath = path.join(__dirname, '../data/inventory.json');
const mutasiPath = path.join(__dirname, '../data/mutasi.json');

// Helper Load/Save
const loadJson = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
    return JSON.parse(fs.readFileSync(filePath));
};
const saveJson = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// Fungsi Format Rupiah
const formatRupiah = (angka) => {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// 🔥 FUNGSI PENCATAT MUTASI (BARU) 🔥
const catatMutasi = (userId, tipe, nominal, keterangan) => {
    const db = loadJson(mutasiPath);
    if (!db[userId]) db[userId] = [];

    // Tambah catatan baru di paling atas (unshift)
    db[userId].unshift({
        date: new Date().toLocaleString('id-ID'), // Tanggal & Jam
        type: tipe, // MASUK / KELUAR
        amount: formatRupiah(nominal),
        desc: keterangan || 'Transaksi Tanpa Keterangan'
    });

    // Batasi cuma simpan 50 transaksi terakhir biar gak berat
    if (db[userId].length > 50) db[userId].pop();

    saveJson(mutasiPath, db);
};

module.exports = {
    formatRupiah,

    // Cek Saldo
    cekSaldo: (userId) => {
        const db = loadJson(dbPath);
        return db[userId] || 0;
    },

    // Tambah Saldo (+Catat Mutasi)
    addSaldo: (userId, amount, keterangan = 'Pendapatan Lain-lain') => {
        const db = loadJson(dbPath);
        const saldoAwal = db[userId] || 0;
        db[userId] = saldoAwal + amount;
        saveJson(dbPath, db);
        
        // Catat
        catatMutasi(userId, 'MASUK 🟢', amount, keterangan);
        return db[userId];
    },

    // Kurang Saldo (+Catat Mutasi)
    kurangSaldo: (userId, amount, keterangan = 'Pembelian/Denda') => {
        const db = loadJson(dbPath);
        const saldoAwal = db[userId] || 0;
        if (saldoAwal < amount) return false; // Gagal kalau kurang

        db[userId] = saldoAwal - amount;
        saveJson(dbPath, db);

        // Catat
        catatMutasi(userId, 'KELUAR 🔴', amount, keterangan);
        return true;
    },

    // Cek Inventory
    cekInventory: (userId) => {
        const db = loadJson(invPath);
        return db[userId] || {};
    },

    // Tambah Item
    addItem: (userId, itemName, amount = 1) => {
        const db = loadJson(invPath);
        if (!db[userId]) db[userId] = {};
        if (!db[userId][itemName]) db[userId][itemName] = 0;
        
        db[userId][itemName] += amount;
        saveJson(invPath, db);
    },

    // Pakai Item
    useItem: (userId, itemName) => {
        const db = loadJson(invPath);
        if (!db[userId] || !db[userId][itemName] || db[userId][itemName] < 1) return false;

        db[userId][itemName] -= 1;
        if (db[userId][itemName] === 0) delete db[userId][itemName];
        
        saveJson(invPath, db);
        return true;
    }
};