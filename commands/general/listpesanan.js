const fs = require('fs');

// Baca database sementara (Pastikan file data/listpesanan.json sudah dibuat sebelumnya dengan isi {} )
const listPath = './data/listpesanan.json';
let listData = JSON.parse(fs.readFileSync(listPath));

// --- 1. Logika Membuat List ---
if (command === 'buatlist') {
    const topik = args.join(" ");
    if (!topik) return reply("Tulis topiknya! Contoh: .buatlist Pesanan Kaos");
    
    listData[groupId] = {
        topik: topik,
        peserta: []
    };
    fs.writeFileSync(listPath, JSON.stringify(listData, null, 2));
    reply(`📝 List *${topik}* berhasil dibuat!\n\nSilakan ketik *.list [keterangan]* untuk mendaftar.`);
}

// --- 2. Logika Mengisi List ---
if (command === 'list') {
    if (!listData[groupId]) return reply("Belum ada list yang aktif di grup ini. Bikin dulu pakai .buatlist");
    
    const keterangan = args.join(" ");
    if (!keterangan) return reply("Mau list apa? Contoh: .list Ukuran L");

    // pushname adalah variabel bawaan untuk nama WhatsApp user
    listData[groupId].peserta.push(`${pushname} - ${keterangan}`); 
    fs.writeFileSync(listPath, JSON.stringify(listData, null, 2));
    
    reply(`✅ Berhasil masuk list! Ketik *.ceklist* untuk melihat daftar.`);
}

// --- 3. Logika Mengecek List ---
if (command === 'ceklist') {
    if (!listData[groupId] || listData[groupId].peserta.length === 0) {
        return reply("Daftar masih kosong atau belum ada list yang dibuat.");
    }
    
    let teks = `📋 *LIST: ${listData[groupId].topik}*\n\n`;
    listData[groupId].peserta.forEach((orang, index) => {
        teks += `${index + 1}. ${orang}\n`;
    });
    
    reply(teks);
}

// --- 4. Logika Menghapus List ---
if (command === 'hapuslist') {
    delete listData[groupId];
    fs.writeFileSync(listPath, JSON.stringify(listData, null, 2));
    reply("🗑️ List di grup ini berhasil dihapus.");
}