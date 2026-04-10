module.exports = {
    name: 'menu',
    description: 'Menampilkan daftar perintah lengkap',
    type: 'general',
    async execute(client, msg, args, { contact }) {
        const pushname = contact.pushname || contact.number;
        
        // Header Menu
        let menu = `🤖 *MENU BOT LENGKAP* 🤖
Halo, *${pushname}*! Berikut daftar perintah yang tersedia:

🛠️ *FITUR UMUM (TOOLS)*
• *!sticker* : Gambar ➡️ Stiker
• *!steks* : Teks ➡️ Stiker Keren
• *!tts* : Teks ➡️ Suara Google
• *!menfess* : Kirim pesan rahasia
• *!topup* : Isi saldo bot
• *!premium* : Beli akses premium
• *!cuaca* : Cek cuaca kota
• *!sholat* : Jadwal sholat
• *!quran* : Baca Al-Quran
• *!hadits* : Cari hadits
• *!quotes* : Kata mutiara
• *!loker* : Info lowongan kerja
• *!reminder* : Pasang pengingat
• *!voting* : Buat voting
• *!meet* : Link meeting online

🎉 *HIBURAN (FUN)*
• *!cekkhodam* : Cek khodam lucu
• *!siapa* : Tunjuk orang random
• *!seberapa* : Cek kadar sifat
• *!patungan* : Hitung bagi tagihan
• *!gelar* : Kasih gelar ke teman
• *!kapsulwaktu* : Tulis pesan masa depan
• *!bukakapsul* : Buka pesan masa lalu
• *!ultah* : Cek ultah teman
• *!setultah* : Simpan ultah kamu
• *!jomblo* : Cek durasi jomblo
• *!setjomblo* : Set tanggal jomblo

🎮 *GAME & EKONOMI*
• *!saldo* : Cek uang & inventory
• *!toko* : Belanja item unik
• *!beli* : Beli barang (!beli [nama])
• *!itemsaya* : Cek cara pakai item
• *!kuis* : Kuis pengetahuan
• *!tebakgambar* : Tebak gambar
• *!sambungkata* : Sambung kata
• *!ttt* : Tic Tac Toe VS Teman
• *!sambungayam* : Adu ayam (!sambungayam @lawan 5000)
• *!tebak* : Judi angka 1-10
• *!mancing* : Cari uang (Gacha)
• *!curi* : Curi uang (Perlu Tuyul)
• *!petir* : Bakar uang (Perlu Petir)
• *!bukakotak* : Buka kotak misteri

👮 *ADMIN GRUP*
• *!kick* : Keluarkan member
• *!promote* : Jadikan admin
• *!demote* : Turunkan admin
• *!tagall* : Tag semua member
• *!hidetag* : Tag tersembunyi
• *!warn* : Beri peringatan (3x = kick)
• *!hapus* : Hapus pesan orang
• *!buka* : Buka foto Sekali Lihat (ViewOnce)
• *!tutupgrup* : Kunci chat
• *!bukagrup* : Buka chat
• *!bukaabsen* : Mulai absen
• *!tutupabsen* : Stop absen
• *!blacklist* : Blokir member di grup
• *!bukablacklist* : Lepas blokir
• *!sapu* : Bersihkan 10 pesan terakhir

👑 *OWNER ONLY*
• *!on / !off* : Matikan/Hidupkan Bot
• *!fitur* : Atur Anti-Link/Virtex/ViewOnce
• *!premium [fitur] [limit] [harga]* : Atur harga fitur

_Gunakan bot dengan bijak!_`;

        // Kirim Menu
        // Kita gunakan try-catch agar kalau teks kepanjangan tidak crash
        try {
            await msg.reply(menu);
        } catch (e) {
            await msg.reply('❌ Menu terlalu panjang atau terjadi kesalahan.');
        }
    }
};