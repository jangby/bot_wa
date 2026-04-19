const db = require('./database'); // Memanggil jembatan MariaDB

// Memori RAM Sementara
let dbUang = {};
let dbInv = {};

// 1. LOAD DATA DARI DATABASE SAAT BOT NYALA
const loadData = async () => {
    try {
        const [users] = await db.query('SELECT user_id, balance FROM users');
        users.forEach(u => dbUang[u.user_id] = Number(u.balance));

        const [invs] = await db.query('SELECT user_id, item_name, quantity FROM inventories');
        invs.forEach(i => {
            if (!dbInv[i.user_id]) dbInv[i.user_id] = {};
            dbInv[i.user_id][i.item_name] = Number(i.quantity);
        });
        console.log('✅ Data Ekonomi & Inventory sukses dimuat dari MariaDB!');
    } catch (err) {
        console.error('❌ Gagal load data MariaDB:', err.message);
    }
};
loadData();

// 2. AUTO-SAVE KE DATABASE TIAP 30 DETIK DI LATAR BELAKANG
setInterval(async () => {
    try {
        // Simpan Uang
        for (const [userId, balance] of Object.entries(dbUang)) {
            await db.query(
                'INSERT INTO users (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = ?',
                [userId, balance, balance]
            );
        }
        // Simpan Inventory
        for (const [userId, items] of Object.entries(dbInv)) {
            for (const [itemName, qty] of Object.entries(items)) {
                if (qty > 0) {
                    await db.query(
                        'INSERT INTO inventories (user_id, item_name, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?',
                        [userId, itemName, qty, qty]
                    );
                } else {
                    // Jika barang habis, hapus dari database
                    await db.query('DELETE FROM inventories WHERE user_id = ? AND item_name = ?', [userId, itemName]);
                }
            }
        }
    } catch (err) {
        // Error disembunyikan agar log tidak spam, tapi tetap berjalan
    }
}, 30000);

// Fungsi Format Rupiah
const formatRupiah = (angka) => {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Fungsi Mencatat Mutasi Langsung ke Database (Fire and Forget)
const catatMutasi = (userId, tipe, nominal, keterangan) => {
    const tipeDB = tipe.includes('MASUK') ? 'MASUK' : 'KELUAR';
    db.query('INSERT INTO mutasi_transaksi (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, tipeDB, nominal, keterangan])
      .catch(err => console.error('Gagal catat mutasi:', err.message));
};

module.exports = {
    formatRupiah,

    // Cek Saldo (Instan dari RAM)
    cekSaldo: (userId) => {
        return dbUang[userId] || 0;
    },

    // Tambah Saldo
    addSaldo: (userId, amount, keterangan = 'Pendapatan Lain-lain') => {
        const saldoAwal = dbUang[userId] || 0;
        dbUang[userId] = saldoAwal + amount; 
        catatMutasi(userId, 'MASUK 🟢', amount, keterangan);
        return dbUang[userId];
    },

    // Kurang Saldo
    kurangSaldo: (userId, amount, keterangan = 'Pembelian/Denda') => {
        const saldoAwal = dbUang[userId] || 0;
        if (saldoAwal < amount) return false; 

        dbUang[userId] = saldoAwal - amount; 
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