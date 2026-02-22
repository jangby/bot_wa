const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBf2rJ4Ip8yA3yw3E53kzCL-16wz7TLScA");
let activeKuis = {};
let blacklistedUsers = [];
let inactiveGroups = [];
let playersData = {};
let catatanGrup = {};
const googleTTS = require('google-tts-api'); // Modul untuk Text-to-Speech
const kumpulanQuotes = require('./quotes.js');
const bankSoal = require('./bankSoal.js'); // Memanggil bank soal kuis
const os = require('os'); // Modul bawaan untuk info sistem
const startTime = new Date(); // Mencatat waktu bot pertama kali dijalankan
const { exec } = require('child_process');
const fs = require('fs');
const sudoUsers = [
    '6285136468097@c.us'
];
let disabledFeatures = [];
let ttsCooldowns = {};
let ultahData = {};
let kasData = {};
const daftarKhodam = [
    "Kipas Angin Rusak (Suka bikin orang kepanasan emosi)",
    "Naga Sakti (Suka tidur siang, bangun-bangun makan banyak)",
    "Knalpot Racing (Berisik banget kalau lagi ngumpul)",
    "Macan Cisewu (Keliatannya garang tapi aslinya gemesin)",
    "Sapu Lidi (Suka ngumpulin temen-temen buat nongkrong)",
    "Ceker Ayam (Suka jalan-jalan ga jelas arahnya)",
    "Guling Lecek (Selalu dicari kalau temen lagi butuh sandaran)",
    "Kalkulator Rusak (Suka perhitungan tapi sering salah)",
    "Powerbank (Penyelamat temen di saat genting)",
    "Kopi Sachet (Murah senyum dan merakyat)"
];

// GANTI INI DENGAN ID GRUP ANGKATANMU NANTI (Cara ceknya ada di Langkah 4)
const ID_GRUP_ANGKATAN = "1234567890@g.us";

let sesiAbsen = {};
let daftarKataKasar = [
    // --- ANJING & Variannya ---
    'anjing', 'anj1ng', 'anj!ng', '4njing', '4nj1ng', '4nj!ng', 'anjg', 'njing', 'njeng', 'asu', '4su', 'asv', 'asyu', 'anj', 'anjj',

    // --- BABI & Variannya ---
    'babi', 'bab1', 'bab!', 'b4bi', 'b4b1', 'b4b!', 'bb',

    // --- BANGSAT, BAJINGAN & KEPARAT ---
    'bangsat', 'bangs4t', 'b4ngsat', 'b4ngs4t', 'bgst',
    'bajingan', 'baj1ngan', 'baj!ngan', 'b4jingan', 'bjingan', 'bjgn',
    'brengsek', 'brngsek', 'brengs3k', 'br3ngs3k',
    'keparat', 'k3parat', 'kepar4t', 'k3par4t',

    // --- KEBODOHAN ---
    'goblok', 'g0blok', 'gobl0k', 'g0bl0k', 'gblk', 'goblog', 'g0bl0g',
    'tolol', 't0lol', 'tol0l', 't0l0l', 'tll',
    'bodoh', 'b0doh', 'bod0h', 'b0d0h', 'bdh',
    'bego', 'b3go', 'beg0', 'b3g0', 
    'dongo', 'd0ngo', 'dong0', 'd0ng0', 
    'idiot', '1diot', 'id1ot', '!diot', '1d10t',

    // --- KATA KOTOR / VULGAR ---
    'ngentot', 'ng3ntot', 'ngent0t', 'ng3nt0t', 'ngewe', 'ng3w3',
    'kontol', 'k0ntol', 'kont0l', 'k0nt0l', 'kntl', 'kanjut', 'knjt',
    'memek', 'm3mek', 'mem3k', 'm3m3k', 'mmk', 'itil',
    'peler', 'pel3r', 'p3ler', 'p3l3r', 'plr',
    'jembut', 'j3mbut', 'jembvt', 'jmbt',
    'lonte', 'l0nte', 'lont3', 'l0nt3',
    'jablay', 'j4blay', 'jabl4y', 'j4bl4y',
    'monyet', 'm0nyet', 'mony3t', 'm0ny3t', 'kunyuk'
];

// Fungsi untuk membuat/mengambil data pemain (otomatis dapat 100 poin pertama)
function getPlayer(id) {
    if (!playersData[id]) {
        playersData[id] = { points: 100, kebalUntil: 0 }; 
    }
    return playersData[id];
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    ffmpegPath: 'ffmpeg',
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot berhasil terhubung dan siap menerima semua perintah!');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();

    // 1. Definisikan ID pengirim dulu agar bisa dicek sudo/owner-nya
    const senderContact = await msg.getContact();
    const senderNumber = senderContact.number; 
    const standardSenderId = `${senderNumber}@c.us`;

    const isPrivateChat = !chat.isGroup;
    const isSudo = sudoUsers.includes(standardSenderId);

    // Deteksi apakah ini pesan menfess dari chat pribadi
    const isMenfess = isPrivateChat && msg.body.toLowerCase().startsWith('!menfess');

    // Bot merespons jika: di grup, di japri oleh Owner, ATAU ada yang mengirim !menfess di japri
    if (chat.isGroup || (isPrivateChat && isSudo) || isMenfess) {
        const participants = chat.isGroup ? chat.participants : [];
        
        let isBotAdmin = false;
        let isSenderAdmin = false;

        if (chat.isGroup) {
            const botId = `${client.info.wid.user}@c.us`; 
            const bot = participants.find(p => p.id._serialized === botId);
            isBotAdmin = bot?.isAdmin || bot?.isSuperAdmin;

            const sender = participants.find(p => p.id._serialized === standardSenderId);
            isSenderAdmin = sender?.isAdmin || sender?.isSuperAdmin;
        }

        // ==========================================
        // 🛡️ AUTO-MODERATOR (ANTI-LINK & FILTER KATA KASAR)
        // ==========================================
        const teksPesanLower = msg.body.toLowerCase();

        // 1. Eksekusi Anti-Link Grup Lain (Cek apakah antilink tidak di-disable)
        if (teksPesanLower.includes('chat.whatsapp.com/') && !disabledFeatures.includes('antilink')) {
            if (isBotAdmin && !isSenderAdmin) {
                try {
                    await msg.delete(true);
                    return msg.reply('🚫 *Anti-Link Aktif:* Anggota biasa tidak diizinkan mengirim link grup luar di sini!');
                } catch (e) { console.log('Gagal hapus link:', e); }
            }
        }

        // ==========================================
        // 2. Eksekusi Filter Kata Kasar (Versi Cerdas & Adil)
        // ==========================================
        let teksNormal = teksPesanLower
            .replace(/[4@]/g, 'a')
            .replace(/[1!]/g, 'i')
            .replace(/[3]/g, 'e')
            .replace(/[0]/g, 'o')
            .replace(/[5$]/g, 's')
            .replace(/[^a-z]/g, '');

        const terdeteksiKasar = daftarKataKasar.some(kata => teksNormal.includes(kata));

        // Cek apakah fitur antikasar tidak di-disable
        if (terdeteksiKasar && !disabledFeatures.includes('antikasar')) {
            console.log(`[LOG KATA KASAR] Terdeteksi dari: ${senderNumber} | isSenderAdmin: ${isSenderAdmin}`);
            
            if (isBotAdmin) {
                try {
                    await msg.delete(true);
                    await chat.sendMessage(`⚠️ *@${senderContact.id.user}*, peringatan! Sistem mendeteksi penggunaan kata tidak pantas. Harap jaga adab dan ketikan di grup ini, meskipun Anda seorang Admin.`, { mentions: [senderContact.id._serialized] });
                    return; 
                } catch (e) { 
                    console.log('Gagal hapus kata kasar:', e); 
                }
            }
        }


        // ==========================================
        // 🛑 SISTEM EKSEKUSI BLACKLIST 
        // ==========================================
        if (blacklistedUsers.includes(standardSenderId)) {
            // Sekarang bot sudah tahu apakah dia isBotAdmin atau bukan!
            if (isBotAdmin) {
                try {
                    await msg.delete(true); 
                } catch (error) {
                    console.log("Gagal menghapus pesan blacklist:", error);
                }
            }
            return; 
        }
        // ==========================================


        // ==========================================
        // 🛑 SISTEM ON / OFF BOT 
        // ==========================================
        // (Lanjutkan kode Anda seperti biasa mulai dari sini ke bawah...)
        const args = msg.body.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // ==========================================
        // 🛑 SISTEM PENGECEKAN FITUR DIMATIKAN
        // ==========================================
        // Jika command yang diketik ada di daftar fitur mati, bot akan diam (kecuali perintah !fitur itu sendiri)
        if (disabledFeatures.includes(command) && command !== '!fitur') {
            return; 
        }

        // ==========================================
        // 🛑 SISTEM ON / OFF BOT 
        // ==========================================
        // Cek apakah grup ini ada di dalam daftar grup yang dimatikan
        const isGroupInactive = inactiveGroups.includes(chat.id._serialized);

        if (isGroupInactive) {
            // Jika admin mengetik !on, kita biarkan kodenya lanjut ke bawah agar bisa dieksekusi
            if (command === '!on' && isSenderAdmin) {
                // Biarkan lolos
            } 
            // Tapi jika ada yang mencoba memakai perintah bot (diawali huruf '!')
            else if (command.startsWith('!')) {
                return msg.reply('😴 Bot sedang dinonaktifkan oleh Admin. Tunggu Admin mengetik *!on*.');
            } 
            // Jika hanya chat biasa, hentikan proses (bot diam saja)
            else {
                return;
            }
        }
        // ==========================================

        // ==========================================
        // FITUR UNTUK SEMUA ANGGOTA (GENERAL)
        // ==========================================

        // ==========================================
        // 🧠 SISTEM PENGECEK JAWABAN KUIS GEMINI
        // ==========================================
        // Mengecek apakah di grup ini sedang ada kuis yang berlangsung
        if (activeKuis[chat.id._serialized]) {
            const jawabanBenar = activeKuis[chat.id._serialized].jawaban;
            
            // Jika chat dari anggota sama persis dengan jawaban kuis (huruf besar/kecil tidak masalah)
            if (msg.body.trim().toLowerCase() === jawabanBenar.toLowerCase()) {
                
                let player = getPlayer(standardSenderId);
                let hadiah = activeKuis[chat.id._serialized].reward;
                player.points += hadiah; // Menambahkan poin ke pemenang

                msg.reply(`🎉 *TEBAKAN BENAR!* 🎉\n\nSelamat, jawabannya memang *${jawabanBenar.toUpperCase()}*!\nKamu berhasil mendapatkan *+${hadiah} Poin*.\n💰 Saldo kamu sekarang: *${player.points}*`);
                
                // Menghapus kuis dari memori karena sudah tertebak
                delete activeKuis[chat.id._serialized];
                
                // Menghentikan kode di sini agar bot tidak mengira ini perintah lain
                return; 
            }
        }

        if (command === '!ping') {
            const uptimeServer = formatUptime(os.uptime()); // Durasi VPS menyala
            const uptimeBot = formatUptime((new Date() - startTime) / 1000); // Durasi Bot menyala
            const sejakKapan = startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }); // Waktu mulai bot

            msg.reply(`🏓 *PONG! BOT AKTIF*

🖥️ *Info Server:*
• *Uptime VPS:* ${uptimeServer}
• *Uptime Bot:* ${uptimeBot}
• *Aktif Sejak:* ${sejakKapan} WIB

_Bot siap melayani grup ini!_`);
        }

        // ==========================================
        // 👻 FITUR CEK KHODAM
        // ==========================================
        else if (command === '!cekkhodam' || command === '!khodam') {
            // Jika ada nama yang diketik, gunakan itu. Jika tidak, gunakan nama profil WA nya
            const nama = args.length > 0 ? args.join(' ') : senderContact.pushname || "Kamu";
            const randomKhodam = daftarKhodam[Math.floor(Math.random() * daftarKhodam.length)];
            
            msg.reply(`🔍 *HASIL TERAWANG KHODAM*\n\nNama: *${nama}*\nKhodam Pendamping: *${randomKhodam}*`);
        }

        // ==========================================
        // 🎯 FITUR RANDOM TAG / SIAPA
        // ==========================================
        else if (command === '!siapa') {
            if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di dalam grup!');
            if (args.length === 0) return msg.reply('❌ Masukkan pertanyaannya!\nContoh: *!siapa yang paling sering telat?*');

            const pertanyaan = args.join(' ');
            
            // Ambil semua member grup kecuali bot itu sendiri
            const members = participants.filter(p => p.id._serialized !== client.info.wid._serialized);
            const randomMember = members[Math.floor(Math.random() * members.length)];

            await chat.sendMessage(`🎯 *PERTANYAAN:* ${pertanyaan}\n\n🤖 Menurut penerawangan AI Bot, orangnya adalah... @${randomMember.id.user} !`, {
                mentions: [randomMember.id._serialized]
            });
        }

        // ==========================================
        // 🎂 FITUR KALENDER ULANG TAHUN
        // ==========================================
        else if (command === '!setultah') {
            if (args.length === 0) return msg.reply('❌ Format salah!\nCara pakai: *!setultah DD-MM*\nContoh: *!setultah 15-08* (Untuk 15 Agustus)');
            
            const tanggal = args[0];
            if (!/^\d{2}-\d{2}$/.test(tanggal)) return msg.reply('❌ Format tanggal harus DD-MM (Contoh: 15-08)');

            const nama = senderContact.pushname || senderNumber;
            ultahData[standardSenderId] = { nama: nama, tanggal: tanggal };
            msg.reply(`🎂 Ulang tahun kamu (*${tanggal}*) berhasil disimpan di memori bot!`);
        }
        else if (command === '!ultah') {
            if (Object.keys(ultahData).length === 0) return msg.reply('📭 Belum ada data ulang tahun yang disimpan.\nKetik *!setultah DD-MM* untuk mendaftar.');
            
            // Mengambil bulan saat ini (misal Agustus = "08")
            const bulanIni = ("0" + (new Date().getMonth() + 1)).slice(-2);
            let daftar = `🎂 *YANG ULANG TAHUN BULAN INI (${bulanIni})* 🎂\n\n`;
            let ada = false;

            for (const id in ultahData) {
                const data = ultahData[id];
                const bulanUltah = data.tanggal.split('-')[1]; // Mengambil angka bulannya saja
                if (bulanUltah === bulanIni) {
                    daftar += `- ${data.nama} (*${data.tanggal}*)\n`;
                    ada = true;
                }
            }

            if (!ada) daftar += "_Tidak ada teman angkatan yang berulang tahun di bulan ini._";
            msg.reply(daftar);
        }

        // ==========================================
        // 💰 FITUR BUKU KAS ANGKATAN
        // ==========================================
        else if (command === '!kas') {
            if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa digunakan di grup.');
            const groupId = chat.id._serialized;
            
            if (!kasData[groupId]) {
                kasData[groupId] = { total: 0, history: [] }; // Buat buku kas baru jika belum ada
            }

            const aksi = args[0] ? args[0].toLowerCase() : '';
            
            if (aksi === 'tambah' || aksi === 'kurang') {
                if (!isSenderAdmin && !isSudo) return msg.reply('❌ Hanya Admin Grup yang bisa mengubah saldo kas!');
                if (args.length < 3) return msg.reply(`❌ Format salah!\nContoh: *!kas ${aksi} 50000 dari Doni*`);

                const nominal = parseInt(args[1]);
                if (isNaN(nominal) || nominal <= 0) return msg.reply('❌ Nominal harus berupa angka yang valid!');

                const keterangan = args.slice(2).join(' ');
                
                if (aksi === 'tambah') {
                    kasData[groupId].total += nominal;
                    kasData[groupId].history.push(`[+] Rp ${nominal} (${keterangan})`);
                    msg.reply(`✅ Saldo kas berhasil *ditambah Rp ${nominal}*\nKeterangan: ${keterangan}\n💰 Total Saldo: *Rp ${kasData[groupId].total}*`);
                } else {
                    if (kasData[groupId].total < nominal) return msg.reply(`❌ Saldo kas tidak cukup! Saldo saat ini: *Rp ${kasData[groupId].total}*`);
                    kasData[groupId].total -= nominal;
                    kasData[groupId].history.push(`[-] Rp ${nominal} (${keterangan})`);
                    msg.reply(`✅ Saldo kas berhasil *dikurangi Rp ${nominal}*\nKeterangan: ${keterangan}\n💰 Total Saldo: *Rp ${kasData[groupId].total}*`);
                }
            } else {
                // Tampilkan Info Kas Jika Hanya Mengetik !kas
                let info = `💼 *BUKU KAS ANGKATAN* 💼\n\n💰 *Total Saldo Saat Ini:* Rp ${kasData[groupId].total}\n\n*Catatan Terakhir:*\n`;
                if (kasData[groupId].history.length === 0) {
                    info += "_Belum ada riwayat pemasukan/pengeluaran._";
                } else {
                    // Hanya mengambil 5 riwayat transaksi terakhir agar pesan tidak terlalu panjang
                    const historiTerakhir = kasData[groupId].history.slice(-5);
                    historiTerakhir.forEach(h => {
                        info += `${h}\n`;
                    });
                }
                msg.reply(info);
            }
        }

        // ==========================================
        // 📩 FITUR MENFESS (PESAN ANONIM)
        // ==========================================
        else if (command === '!menfess') {
            // Pastikan ini lewat chat pribadi
            if (chat.isGroup) {
                return msg.reply('❌ Sssttt... Kirim perintah *!menfess* lewat chat pribadi (Japri) ke bot agar rahasia terjaga!');
            }

            const pesanMenfess = args.join(' ');
            if (!pesanMenfess) return msg.reply('❌ Masukkan pesan yang ingin disampaikan!\nContoh: *!menfess Halo angkatan, jangan lupa kumpul besok ya!*');

            try {
                // Mengirim pesan ke Grup Angkatan
                const grupAngkatan = await client.getChatById(ID_GRUP_ANGKATAN);
                
                await grupAngkatan.sendMessage(`📩 *PESAN ANONIM (MENFESS) MASUK* 📩\n\n_"${pesanMenfess}"_\n\n_Pesan ini dikirim secara rahasia melalui Bot._`);
                msg.reply('✅ Pesan anonim kamu berhasil dikirim dan disebarkan ke grup angkatan!');
            } catch (error) {
                console.log("Error Menfess:", error);
                msg.reply('❌ Gagal mengirim pesan. Pastikan bot sudah dimasukkan ke grup angkatan dan ID_GRUP_ANGKATAN sudah diisi dengan benar oleh Owner.');
            }
        }

        // Alat bantu untuk Owner mengetahui ID Grup (Bisa dihapus nanti)
        else if (command === '!cekidgrup' && isSudo) {
            msg.reply(`ID Grup ini adalah:\n*${chat.id._serialized}*\n\n_Copy ID ini dan masukkan ke variabel ID_GRUP_ANGKATAN di dalam kode index.js_`);
        }

        else if (command === '!fitur') {
            // Validasi: Hanya Sudo / Owner yang bisa menggunakan perintah ini
            if (!isSudo) {
                return msg.reply('❌ Maaf, perintah ini HANYA bisa digunakan oleh Owner bot!');
            }
            
            if (args.length < 2) {
                return msg.reply('❌ Format salah!\nCara pakai: *!fitur [nama_perintah/fitur] [on/off]*\n\n*Contoh mematikan perintah:* \n!fitur !tts off\n!fitur !quran off\n\n*Contoh mematikan auto-moderator:*\n!fitur antilink off\n!fitur antikasar off');
            }

            const targetFeature = args[0].toLowerCase();
            const action = args[1].toLowerCase();

            if (action === 'off') {
                if (!disabledFeatures.includes(targetFeature)) {
                    disabledFeatures.push(targetFeature);
                }
                msg.reply(`✅ Sistem: Fitur *${targetFeature}* berhasil DIMATIKAN secara global.`);
            } else if (action === 'on') {
                disabledFeatures = disabledFeatures.filter(f => f !== targetFeature);
                msg.reply(`✅ Sistem: Fitur *${targetFeature}* berhasil DIAKTIFKAN kembali.`);
            } else {
                msg.reply('❌ Argumen tidak valid! Gunakan "on" atau "off".');
            }
        }

        else if (command === '!menu' || command === '!help') {
            const menu = `*🤖 BUKU PANDUAN BOT GRUP 🤖*

*👤 FITUR UMUM & UTILITAS*
• *!ping* : Cek status keaktifan bot
• *!menu* : Tampilkan pesan panduan ini
• *!infogrup* : Lihat info detail grup
• *!admin* : Panggil semua admin grup
• *!cuaca [kota]* : Info cuaca hari ini
• *!quotes* : Kata-kata mutiara acak

*🕌 FITUR ISLAMI*
• *!sholat [kota]* : Jadwal sholat 5 waktu
• *!quran [surah] [ayat]* : Tafsir & terjemahan ayat
• *!hadits [perawi] [nomor]* : Cari hadits spesifik

*🛠️ MEDIA & ALAT BANTU*
• *!sticker* : Buat stiker (Kirim/Reply foto dgn !sticker)
• *!steks [teks]* : Buat stiker teks tebal
• *!vn* : Ubah file MP3 jadi Voice Note
• *!tts [teks]* : Ubah teks jadi suara (Text-to-Speech)
• *!translate [bahasa] [teks]* : Terjemahan AI (id/en/ar/su)
• *!zoom* / *!meet* : Buat link ruang rapat online (Admin)

*📋 PRODUKTIVITAS GRUP*
• *!reminder [waktu] [pesan]* : Pasang pengingat (Contoh: 10m Rapat pengurus)
• *!simpan [judul] [isi]* : Simpan informasi penting
• *!catatan* : Lihat daftar catatan grup yang tersimpan
• *!bukaabsen [nama acara]* : Buka sesi daftar hadir (Admin)
• *!hadir* : Mengisi daftar hadir
• *!tutupabsen* : Tutup absen & lihat rekapitulasi (Admin)

*🎮 MINI GAME & EKONOMI*
• *!kuis* : Kuis tebak-tebakan bersama AI Gemini
• *!saldo* : Cek jumlah poin & status VIP kamu
• *!tebak [1-10] [taruhan]* : Main tebak angka 
• *!belikebal* : Beli perlindungan dari Kick (1000 Poin)

*👑 MODERASI (Khusus Admin)*
• *!tagall* : Mention semua anggota grup
• *!kick @user* : Keluarkan anggota (Kecuali VIP)
• *!promote* / *!demote @user* : Atur jabatan admin
• *!tutupgrup* / *!bukagrup* : Kunci/buka akses chat grup
• *!blacklist @user* : Hapus pesan orang ini secara otomatis
• *!bukablacklist @user* : Cabut hukuman blacklist
• *!off* / *!on* : Matikan/nyalakan bot di grup ini

*🛡️ SISTEM OTOMATIS BOT (Selalu Aktif)*
• *Anti-Link*: Menghapus link grup luar yang dikirim anggota biasa.
• *Filter Kata Kasar*: Menjaga adab percakapan dengan menghapus pesan tidak pantas.`;

            msg.reply(menu);
        }

        else if (command === '!infogrup') {
            msg.reply(`*Info Grup*\nNama: ${chat.name}\nDeskripsi: ${chat.description || 'Tidak ada deskripsi'}\nJumlah Anggota: ${participants.length} orang`);
        }

        // ==========================================
        // 🕌 FITUR JADWAL SHOLAT (!jadwalsholat / !sholat)
        // ==========================================
        else if (command === '!jadwalsholat' || command === '!sholat') {
            if (args.length === 0) return msg.reply('❌ Harap masukkan nama kota!\nContoh: *!jadwalsholat Bandung*');
            
            // Menggabungkan spasi jika nama kota lebih dari 1 kata (misal: Jakarta Selatan)
            const kota = args.join(' '); 
            
            try {
                msg.reply('⏳ Sedang mencari jadwal sholat...');
                
                // Memanggil API gratis dari Aladhan
                const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=11`);
                const result = await response.json();

                if (result.code === 200) {
                    const jadwal = result.data.timings;
                    const tanggal = result.data.date.readable;

                    let pesanSholat = `🕌 *JADWAL SHOLAT* 🕌\n`;
                    pesanSholat += `📍 Kota: *${kota.toUpperCase()}*\n`;
                    pesanSholat += `📅 Tanggal: *${tanggal}*\n\n`;
                    pesanSholat += `🌅 Imsak: *${jadwal.Imsak}*\n`;
                    pesanSholat += `🌄 Subuh: *${jadwal.Fajr}*\n`;
                    pesanSholat += `☀️ Terbit: *${jadwal.Sunrise}*\n`;
                    pesanSholat += `🕛 Dzuhur: *${jadwal.Dhuhr}*\n`;
                    pesanSholat += `🌇 Ashar: *${jadwal.Asr}*\n`;
                    pesanSholat += `🌅 Maghrib: *${jadwal.Maghrib}*\n`;
                    pesanSholat += `🌌 Isya: *${jadwal.Isha}*\n\n`;
                    pesanSholat += `_Semoga ibadah kita hari ini dilancarkan._ 🤲`;

                    msg.reply(pesanSholat);
                } else {
                    msg.reply('❌ Kota tidak ditemukan. Pastikan penulisan nama kota benar.');
                }
            } catch (error) {
                console.log("Error Jadwal Sholat:", error);
                msg.reply('❌ Gagal mengambil data jadwal sholat. Coba lagi nanti.');
            }
        }

        // ==========================================
        // 🌤️ FITUR INFO CUACA (!cuaca)
        // ==========================================
        else if (command === '!cuaca') {
            if (args.length === 0) return msg.reply('❌ Harap masukkan nama kota!\nContoh: *!cuaca Surabaya*');
            
            const kota = args.join(' ');
            
            try {
                msg.reply('⏳ Mengecek kondisi cuaca...');
                
                // Memanggil API gratis dari wttr.in (format JSON)
                const response = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=j1`);
                const data = await response.json();
                
                const cuacaSekarang = data.current_condition[0];
                const suhu = cuacaSekarang.temp_C;
                const kelembapan = cuacaSekarang.humidity;
                const angin = cuacaSekarang.windspeedKmph;
                // Cuaca dari API ini memakai bahasa Inggris secara default
                const deskripsi = cuacaSekarang.weatherDesc[0].value; 

                let pesanCuaca = `🌤️ *INFO CUACA: ${kota.toUpperCase()}* 🌤️\n\n`;
                pesanCuaca += `🌡️ Suhu Saat Ini: *${suhu}°C*\n`;
                pesanCuaca += `☁️ Kondisi: *${deskripsi}*\n`;
                pesanCuaca += `💧 Kelembapan Air: *${kelembapan}%*\n`;
                pesanCuaca += `💨 Kecepatan Angin: *${angin} km/jam*\n\n`;
                pesanCuaca += `_Prakiraan cuaca didapatkan secara real-time._`;

                msg.reply(pesanCuaca);
            } catch (error) {
                console.log("Error Cuaca:", error);
                msg.reply('❌ Gagal mendapatkan info cuaca. Pastikan nama kota benar atau server API sedang sibuk.');
            }
        }

        // ==========================================
        // 📥 FITUR DOWNLOADER (TikTok, IG, FB, YouTube)
        // ==========================================
        else if (command === '!dl') {
    const url = args[0];
    if (!url) return msg.reply('❌ Masukkan link videonya! Contoh: *!dl https://...*');

    msg.reply('⏳ Sedang memproses video, mohon tunggu... (Proses ini butuh waktu tergantung durasi)');

    const fileName = `video_${Date.now()}.mp4`;
    const outputPath = `./${fileName}`;

    // Perintah sakti yt-dlp agar formatnya cocok untuk WhatsApp (H.264 + AAC)
    // -f "mp4" memastikan kita ambil mp4
    // --merge-output-format mp4 memastikan hasil akhir mp4
    const cmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return msg.reply('❌ Gagal mendownload video. Pastikan link valid atau coba lagi nanti.');
        }

        try {
            // Mengirim file yang sudah didownload
            const media = MessageMedia.fromFilePath(outputPath);
            await client.sendMessage(msg.from, media, {
                caption: '✅ Video berhasil didownload!',
                sendMediaAsDocument: false // Kirim sebagai video biasa, bukan file dokumen
            });

            // Hapus file setelah dikirim agar tidak memenuhi penyimpanan VPS
            fs.unlinkSync(outputPath);
        } catch (err) {
            console.error('Error saat mengirim file:', err);
            msg.reply('❌ Video terlalu besar untuk dikirim via WhatsApp (Limit: 16-64MB).');
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    });
}

        // ==========================================
        // 📋 SISTEM ABSENSI DINAMIS
        // ==========================================
        else if (command === '!bukaabsen') {
            if (!isSenderAdmin) return msg.reply('❌ Hanya Admin yang bisa membuka sesi absensi.');
            
            const namaKegiatan = args.join(' ');
            if (!namaKegiatan) return msg.reply('❌ Masukkan nama kegiatan!\nContoh: *!bukaabsen Rapat Pengurus PSB*');

            // Membuat ruang absensi untuk grup ini
            sesiAbsen[chat.id._serialized] = {
                kegiatan: namaKegiatan,
                peserta: []
            };
            
            msg.reply(`📋 *SESI ABSENSI DIBUKA* 📋\n\nKegiatan: *${namaKegiatan}*\n\nSilakan ketik *!hadir* untuk mencatatkan kehadiran Anda.`);
        }

        else if (command === '!hadir') {
            const absenGrup = sesiAbsen[chat.id._serialized];
            if (!absenGrup) return; // Jika tidak ada sesi absen, bot diam saja

            // Mengambil nama profil WhatsApp pengguna
            const namaPendaftar = senderContact.pushname || senderContact.name || standardSenderId.split('@')[0];

            // Mengecek apakah nama tersebut sudah ada di daftar
            if (!absenGrup.peserta.includes(namaPendaftar)) {
                absenGrup.peserta.push(namaPendaftar);
                msg.reply(`✅ *${namaPendaftar}* berhasil absen!\n_(Total Hadir Sementara: ${absenGrup.peserta.length} orang)_`);
            } else {
                msg.reply('⚠️ Kamu sudah tercatat hadir, tidak perlu absen dua kali.');
            }
        }

        else if (command === '!tutupabsen') {
            if (!isSenderAdmin) return msg.reply('❌ Hanya Admin yang bisa menutup absensi.');
            
            const absenGrup = sesiAbsen[chat.id._serialized];
            if (!absenGrup) return msg.reply('❌ Sedang tidak ada sesi absensi yang terbuka di grup ini.');

            let teksRekap = `📋 *REKAPITULASI ABSENSI* 📋\n\nKegiatan: *${absenGrup.kegiatan}*\n\n*Daftar Hadir:*\n`;
            
            if (absenGrup.peserta.length === 0) {
                teksRekap += `_(Tidak ada yang hadir)_\n`;
            } else {
                absenGrup.peserta.forEach((nama, index) => {
                    teksRekap += `${index + 1}. ${nama}\n`;
                });
            }

            teksRekap += `\n*Total Hadir: ${absenGrup.peserta.length} orang*\n_Sesi absensi telah ditutup._`;
            
            msg.reply(teksRekap);
            delete sesiAbsen[chat.id._serialized]; // Hapus data absensi dari memori setelah ditutup
        }

        // ==========================================
        // 🗣️ TEXT-TO-SPEECH (SUARA ROBOT)
        // ==========================================
        else if (command === '!tts') {
            const teksTts = args.join(' ');
            if (!teksTts) return msg.reply('❌ Masukkan teksnya!\nContoh: *!tts Pengumuman untuk semua santri di asrama*');

            // --- SISTEM ANTI SPAM (COOLDOWN 2 MENIT) ---
            if (!isSudo) { // Jika bukan Owner, maka kena limit
                const waktuSekarang = Date.now();
                const waktuCooldown = 2 * 60 * 1000; // 2 menit = 120.000 milidetik

                // Cek apakah user sudah pernah pakai dan waktunya belum lewat 2 menit
                if (ttsCooldowns[standardSenderId] && (waktuSekarang - ttsCooldowns[standardSenderId]) < waktuCooldown) {
                    const sisaDetik = Math.ceil((waktuCooldown - (waktuSekarang - ttsCooldowns[standardSenderId])) / 1000);
                    return msg.reply(`⏳ *Anti-Spam Aktif:* Kamu baru bisa menggunakan perintah *!tts* lagi dalam ${sisaDetik} detik.`);
                }

                // Catat waktu penggunaan !tts terakhir untuk user ini
                ttsCooldowns[standardSenderId] = waktuSekarang;
            }
            // ------------------------------------------

            try {
                msg.reply('⏳ Sedang memproses suara...');
                
                // Menghasilkan URL audio MP3 menggunakan Google TTS
                const urlAudio = googleTTS.getAudioUrl(teksTts, {
                    lang: 'id',
                    slow: false,
                    host: 'https://translate.google.com',
                });

                // Mendownload dan mengirimkannya sebagai Voice Note
                const mediaAudio = await MessageMedia.fromUrl(urlAudio, { unsafeMime: true });
                await client.sendMessage(msg.from, mediaAudio, { sendAudioAsVoice: true });
            } catch (error) {
                console.log("Error TTS:", error);
                msg.reply('❌ Gagal membuat suara. Teks mungkin terlalu panjang (maksimal 200 karakter).');
            }
        }

        // ==========================================
        // 📖 AL-QURAN API (!quran)
        // ==========================================
        else if (command === '!quran') {
            if (args.length < 2) return msg.reply('❌ Format salah!\nCara pakai: *!quran [nomor_surah] [nomor_ayat]*\nContoh: *!quran 2 255* (Untuk Al-Baqarah ayat 255)');

            const noSurah = args[0];
            const noAyat = args[1];

            try {
                // Mengambil data dari public API equran.id
                const response = await fetch(`https://equran.id/api/v2/surat/${noSurah}`);
                const data = await response.json();

                if (data.code === 200) {
                    // Mencari ayat spesifik di dalam surah tersebut
                    const ayatDetail = data.data.ayat.find(a => a.nomorAyat == noAyat);
                    
                    if (ayatDetail) {
                        let pesanQuran = `📖 *Q.S. ${data.data.namaLatin} (${data.data.nama}) Ayat ${noAyat}*\n\n`;
                        pesanQuran += `${ayatDetail.teksArab}\n\n`;
                        pesanQuran += `_${ayatDetail.teksLatin}_\n\n`;
                        pesanQuran += `*Artinya:*\n"${ayatDetail.teksIndonesia}"`;

                        msg.reply(pesanQuran);
                    } else {
                        msg.reply(`❌ Ayat ${noAyat} tidak ditemukan dalam surah ini.`);
                    }
                } else {
                    msg.reply('❌ Surah tidak ditemukan. Masukkan angka surah 1 - 114.');
                }
            } catch (error) {
                console.log("Error Quran:", error);
                msg.reply('❌ Gagal mengambil data ayat. Server API mungkin sedang sibuk.');
            }
        }

        // ==========================================
        // 📜 HADITS API (!hadits)
        // ==========================================
        else if (command === '!hadits' || command === '!hadis') {
            if (args.length < 2) return msg.reply('❌ Format salah!\nCara pakai: *!hadits [perawi] [nomor]*\nContoh: *!hadits bukhari 1*\n\n_Pilihan perawi: abu-dawud, ahmad, bukhari, darimi, ibnu-majah, malik, muslim, nasai, tirmidzi_');

            const perawi = args[0].toLowerCase();
            const nomor = args[1];

            try {
                // Mengambil data dari public API Hadith Gading
                const response = await fetch(`https://api.hadith.gading.dev/books/${perawi}/${nomor}`);
                const data = await response.json();

                if (data.code === 200) {
                    const haditsIsi = data.data.contents;
                    
                    let pesanHadits = `📜 *Hadits Riwayat ${data.data.name} No. ${nomor}*\n\n`;
                    pesanHadits += `${haditsIsi.arab}\n\n`;
                    pesanHadits += `*Terjemahan:*\n"${haditsIsi.id}"`;

                    msg.reply(pesanHadits);
                } else {
                    msg.reply(`❌ Hadits tidak ditemukan atau nama perawi salah.`);
                }
            } catch (error) {
                console.log("Error Hadits:", error);
                msg.reply('❌ Gagal mengambil data hadits. Pastikan nomor hadits tersedia di database server.');
            }
        }

        // ==========================================
        // 💡 FITUR QUOTES / KATA MUTIARA (!quotes)
        // ==========================================
        else if (command === '!quotes' || command === '!quote') {
            // Daftar kata-kata mutiara (Bisa kamu tambahkan sebanyak-banyaknya di sini)
        
            // Mengambil satu quote secara acak menggunakan Math.random
            const randomQuote = kumpulanQuotes[Math.floor(Math.random() * kumpulanQuotes.length)];
            
            msg.reply(`💡 *Quotes Hari Ini*\n\n_"${randomQuote}"_`);
        }

        // ==========================================
        // ⏰ FITUR REMINDER / PENGINGAT (!reminder)
        // ==========================================
        else if (command === '!reminder' || command === '!ingatkan') {
            if (args.length < 2) {
                return msg.reply('❌ Format salah!\nCara pakai: *!reminder [waktu] [pesan]*\nContoh: *!reminder 10m Rapat pengurus pondok*\n\n_Keterangan waktu: s (detik), m (menit), h (jam)_');
            }

            const waktuInput = args[0].toLowerCase();
            const pesanReminder = args.slice(1).join(' ');
            
            // Mengekstrak angka dan satuan waktu (contoh: '10m' jadi angka 10 dan huruf 'm')
            const waktuRegex = /^(\d+)([smh])$/;
            const match = waktuInput.match(waktuRegex);

            if (!match) {
                return msg.reply('❌ Format waktu tidak valid! Gunakan angka diikuti *s* (detik), *m* (menit), atau *h* (jam).\nContoh: 30s, 15m, 2h.');
            }

            const angka = parseInt(match[1]);
            const satuan = match[2];
            let waktuMs = 0;
            let teksWaktu = '';

            // Mengubah waktu ke dalam satuan Milidetik (Ms) untuk setTimeout
            if (satuan === 's') {
                waktuMs = angka * 1000;
                teksWaktu = `${angka} detik`;
            } else if (satuan === 'm') {
                waktuMs = angka * 60 * 1000;
                teksWaktu = `${angka} menit`;
            } else if (satuan === 'h') {
                waktuMs = angka * 60 * 60 * 1000;
                teksWaktu = `${angka} jam`;
            }

            // Batasan waktu agar memori bot tidak kepenuhan (Maksimal 24 jam)
            if (waktuMs > 24 * 60 * 60 * 1000) {
                return msg.reply('⚠️ Waktu pengingat maksimal adalah 24 jam!');
            }

            msg.reply(`✅ Siap! Saya akan mengingatkan kamu tentang *"${pesanReminder}"* dalam waktu *${teksWaktu}* ke depan.`);

            // Mengeksekusi pengingat setelah waktu habis
            setTimeout(async () => {
                const contact = await msg.getContact();
                await chat.sendMessage(`⏰ *REMINDER UNTUK @${contact.id.user}* ⏰\n\nPesan: ${pesanReminder}`, {
                    mentions: [contact.id._serialized]
                });
            }, waktuMs);
        }

        // ==========================================
        // 📝 FITUR CATATAN GRUP (!simpan & !catatan)
        // ==========================================
        // 1. Menyimpan Catatan Baru
        else if (command === '!simpan') {
            if (args.length < 2) {
                return msg.reply('❌ Format salah!\nCara pakai: *!simpan [nama_judul] [isi_catatan]*\nContoh: *!simpan rekening 1234567890 a/n Bendahara*');
            }

            const judulCatatan = args[0].toLowerCase();
            const isiCatatan = args.slice(1).join(' ');
            const groupId = chat.id._serialized;

            // Membuat wadah catatan untuk grup ini jika belum ada
            if (!catatanGrup[groupId]) {
                catatanGrup[groupId] = {};
            }

            catatanGrup[groupId][judulCatatan] = isiCatatan;
            msg.reply(`✅ Catatan dengan judul *${judulCatatan}* berhasil disimpan!\nKetik *!catatan ${judulCatatan}* untuk melihatnya nanti.`);
        }

        // 2. Melihat dan Membuka Catatan
        else if (command === '!catatan' || command === '!note') {
            const groupId = chat.id._serialized;

            // Jika grup ini belum punya catatan sama sekali
            if (!catatanGrup[groupId] || Object.keys(catatanGrup[groupId]).length === 0) {
                return msg.reply('📭 Belum ada catatan yang disimpan di grup ini.\nKetik *!simpan [judul] [isi]* untuk membuat catatan baru.');
            }

            // Jika user hanya mengetik '!catatan' (minta daftar judul)
            if (args.length === 0) {
                let daftarCatatan = '📚 *DAFTAR CATATAN GRUP* 📚\n\n';
                const judulKumpulan = Object.keys(catatanGrup[groupId]);
                
                judulKumpulan.forEach((judul, index) => {
                    daftarCatatan += `${index + 1}. ${judul}\n`;
                });
                
                daftarCatatan += '\n_Ketik *!catatan [judul]* untuk membuka isinya._';
                return msg.reply(daftarCatatan);
            }

            // Jika user mencari judul spesifik (contoh: '!catatan rekening')
            const judulDicari = args[0].toLowerCase();
            const isi = catatanGrup[groupId][judulDicari];

            if (isi) {
                msg.reply(`📄 *Catatan: ${judulDicari.toUpperCase()}*\n\n${isi}`);
            } else {
                msg.reply(`❌ Catatan dengan judul *${judulDicari}* tidak ditemukan. Ketik *!catatan* untuk melihat daftar judul.`);
            }
        }

        // ==========================================
        // 🌐 FITUR TRANSLATE AI GEMINI (!translate / !tr)
        // ==========================================
        else if (command === '!translate' || command === '!tr') {
            if (args.length === 0) {
                return msg.reply('❌ Format salah!\nCara pakai: *!translate [bahasa_tujuan] [teks]*\nAtau *Reply* pesan orang lain dengan ketik: *!translate id*\n\nContoh bahasa: id (Indonesia), en (Inggris), ar (Arab), su (Sunda)');
            }

            const targetLang = args[0].toLowerCase();
            let textToTranslate = args.slice(1).join(' ');

            // Jika user memakai fitur ini dengan cara me-reply (membalas) pesan sebelumnya
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                textToTranslate = quotedMsg.body;
            }

            // Memastikan ada teks yang mau diterjemahkan
            if (!textToTranslate || textToTranslate.trim() === '') {
                return msg.reply('❌ Tidak ada teks yang bisa diterjemahkan!');
            }

            try {
                msg.reply('⏳ AI sedang menerjemahkan teks...');

                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                
                // Prompt pintar agar AI hanya merespon hasil terjemahannya saja tanpa basa-basi
                const prompt = `Kamu adalah penerjemah profesional. Terjemahkan teks berikut ke kode bahasa "${targetLang}" (contoh: id=Indonesia, en=Inggris, ar=Arab). Jika bahasa tujuan tidak dikenal, terjemahkan ke bahasa Indonesia.
                
HANYA berikan hasil terjemahannya saja, tanpa tambahan kalimat pengantar atau penjelasan apa pun.
Teks yang harus diterjemahkan:
"${textToTranslate}"`;

                const result = await model.generateContent(prompt);
                const translationResult = result.response.text().trim();

                msg.reply(`🌐 *HASIL TERJEMAHAN (${targetLang.toUpperCase()})*\n\n${translationResult}`);
                
            } catch (error) {
                console.log("Error Translate AI:", error);
                msg.reply('❌ Gagal menerjemahkan. Pastikan API Key Gemini valid dan bot terkoneksi internet.');
            }
        }

        else if (command === '!admin') {
            let adminList = "*👑 Daftar Admin Grup:*\n\n";
            let mentions = [];
            for (let p of participants) {
                if (p.isAdmin || p.isSuperAdmin) {
                    adminList += `- @${p.id.user}\n`;
                    mentions.push(p.id._serialized);
                }
            }
            await chat.sendMessage(adminList, { mentions });
        }

        // Fitur Pembuat Stiker
        else if (command === '!sticker' || command === '!stiker') {
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                client.sendMessage(msg.from, media, { 
                    sendMediaAsSticker: true, 
                    stickerName: 'Bot Sticker', 
                    stickerAuthor: 'Grup Kita' 
                });
            } else {
                msg.reply('❌ Cara pakai: Kirim sebuah foto lalu beri *caption* !sticker');
            }
        }

        // Fitur Pembuat Stiker Teks
        else if (command === '!steks') {
            // Menggabungkan sisa kata menjadi satu kalimat teks
            const text = args.join(' ');
            
            // Mengecek apakah pengguna memasukkan teks atau tidak
            if (!text) {
                return msg.reply('❌ Harap masukkan teksnya!\nContoh: *!steks Halo Semua*');
            }

            try {
                // Memberi tahu pengguna bahwa bot sedang memproses
                msg.reply('⏳ Sedang membuat stiker teks, mohon tunggu...');

                // Mengubah teks agar aman dimasukkan ke dalam URL (misal spasi jadi %20)
                const encodedText = encodeURIComponent(text);
                
                // Menggunakan API gratis untuk membuat gambar persegi berisi teks
                // Warna background: 128C7E (Hijau khas WA), Warna teks: ffffff (Putih)
                const imageUrl = `https://placehold.jp/ffffff/000000/512x512.png?css=%7B%22font-size%22%3A%2270px%22%2C%22font-weight%22%3A%22bold%22%7D&text=${encodedText}`;
                
                // Mendownload gambar dari URL tersebut
                const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
                
                // Mengirim kembali gambar tersebut sebagai stiker
                await client.sendMessage(msg.from, media, { 
                    sendMediaAsSticker: true, 
                    stickerName: text.substring(0, 10), // Nama stiker diambil dari 10 huruf pertama
                    stickerAuthor: 'Bot Grup' 
                });
            } catch (error) {
                console.log("Error Stiker Teks:", error);
                msg.reply('❌ Gagal membuat stiker teks. Pastikan koneksi internet bot stabil.');
            }
        }

        // ==========================================
        // 🎵 FITUR CONVERT MP3 KE VOICE NOTE (!vn)
        // ==========================================
        else if (command === '!vn' || command === '!voicenote') {
            // Target awal adalah pesan yang dikirim pengguna itu sendiri
            let targetMsg = msg;

            // Jika pengguna mengetik !vn sambil me-reply (membalas) pesan orang lain/file sebelumnya
            if (msg.hasQuotedMsg) {
                targetMsg = await msg.getQuotedMessage();
            }

            // Mengecek apakah pesan target memiliki media (file)
            if (targetMsg.hasMedia) {
                const media = await targetMsg.downloadMedia();
                
                // Memastikan bahwa file yang didownload benar-benar file audio/MP3
                if (media && media.mimetype.includes('audio')) {
                    msg.reply('⏳ Sedang memproses menjadi Voice Note, mohon tunggu...');
                    
                    try {
                        // Mengirim ulang media tersebut sebagai Voice Note (Pesan Suara)
                        await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
                    } catch (error) {
                        console.log("Error Voice Note:", error);
                        msg.reply('❌ Gagal memproses Voice Note. (Catatan Admin: Pastikan FFmpeg sudah terinstal di sistem).');
                    }
                } else {
                    msg.reply('❌ File yang dipilih/di-reply bukan file Audio atau MP3!');
                }
            } else {
                msg.reply('❌ Cara pakai:\nKirim file MP3 ke grup, lalu *Reply (Balas)* file tersebut dengan ketik *!vn*');
            }
        }

        // ==========================================
        // 🎮 MINI GAME: TEBAK ANGKA & SISTEM POIN
        // ==========================================

        // 1. Cek Saldo dan Status Kebal
        else if (command === '!saldo') {
            let player = getPlayer(standardSenderId);
            let statusKebal = "Tidak Aktif ❌";
            
            // Mengecek apakah waktu kebal masih berlaku (lebih besar dari waktu sekarang)
            if (player.kebalUntil > Date.now()) {
                let sisaJam = Math.ceil((player.kebalUntil - Date.now()) / (1000 * 60 * 60));
                statusKebal = `AKTIF 🛡️ (Sisa ${sisaJam} Jam)`;
            }
            msg.reply(`*💳 BUKU REKENING*\n\n💰 Saldo Poin: *${player.points}*\n🛡️ Status Kebal VIP: *${statusKebal}*`);
        }

        // 2. Game Tebak Angka
        else if (command === '!tebak') {
            if (args.length < 2) return msg.reply('❌ Cara main: *!tebak [angka 1-10] [taruhan]*\nContoh: *!tebak 7 50*');
            
            const tebakan = parseInt(args[0]);
            const taruhan = parseInt(args[1]);

            if (isNaN(tebakan) || tebakan < 1 || tebakan > 10) return msg.reply('⚠️ Tebak angka dari 1 sampai 10 saja!');
            if (isNaN(taruhan) || taruhan <= 0) return msg.reply('⚠️ Jumlah taruhan tidak valid!');

            let player = getPlayer(standardSenderId);
            if (player.points < taruhan) return msg.reply(`💸 Poinmu tidak cukup untuk taruhan ini! Saldo saat ini: *${player.points}*`);

            // Mengacak angka 1 sampai 10
            const angkaRahasia = Math.floor(Math.random() * 10) + 1;
            
            if (tebakan === angkaRahasia) {
                const menang = taruhan * 5;
                player.points += menang;
                msg.reply(`🎉 *JACKPOT! ANGKA RAHASIA ADALAH ${angkaRahasia}!*\n\nTebakanmu benar! Kamu mendapatkan *+${menang} Poin*.\n💰 Saldomu sekarang: *${player.points}*`);
            } else {
                player.points -= taruhan;
                msg.reply(`❌ *YAHH SALAH! ANGKA RAHASIA ADALAH ${angkaRahasia}!*\n\nKamu kehilangan *-${taruhan} Poin*.\n💸 Saldomu sekarang: *${player.points}*`);
            }
        }

        // 4. Game Tebak Hewan/Benda by Gemini AI
        // ==========================================
        // 🧠 GAME KUIS (DARI BANK SOAL LOKAL)
        // ==========================================
        else if (command === '!kuis') {
            // Cek apakah masih ada soal yang belum terjawab di grup ini
            if (activeKuis[chat.id._serialized]) {
                return msg.reply('❌ Masih ada kuis yang belum terjawab di grup ini! Jawab dulu atau tunggu waktunya habis.');
            }

            // Mengacak dan mengambil satu soal dari file bankSoal.js
            const randomSoal = bankSoal[Math.floor(Math.random() * bankSoal.length)];

            // Menyimpan data kuis ke memori grup ini
            activeKuis[chat.id._serialized] = {
                jawaban: randomSoal.jawaban,
                reward: randomSoal.poin
            };

            // Mengirimkan pertanyaan ke grup
            let pesanKuis = `🧠 *KUIS CERDAS CERMAT* 🧠\n\n`;
            pesanKuis += `Pertanyaan:\n*${randomSoal.soal}*\n\n`;
            pesanKuis += `Ketik langsung jawabannya di grup ini!\n`;
            pesanKuis += `💰 _Hadiah: ${randomSoal.poin} Poin_ | ⏳ _Waktu: 60 Detik_`;

            msg.reply(pesanKuis);

            // Membuat timer 60 detik (60000 ms)
            setTimeout(() => {
                // Mengecek apakah setelah 60 detik kuisnya masih ada (belum terjawab)
                if (activeKuis[chat.id._serialized] && activeKuis[chat.id._serialized].jawaban === randomSoal.jawaban) {
                    client.sendMessage(chat.id._serialized, `⏰ *WAKTU HABIS!*\n\nTidak ada yang berhasil menebak.\nJawabannya adalah: *${randomSoal.jawaban.toUpperCase()}*`);
                    delete activeKuis[chat.id._serialized]; // Hapus kuis dari memori
                }
            }, 60000);
        }

        // 3. Toko VIP: Beli Status Kebal (1000 Poin untuk 24 Jam)
        else if (command === '!belikebal') {
            let player = getPlayer(standardSenderId);
            
            if (player.kebalUntil > Date.now()) return msg.reply('⚠️ Kamu masih memiliki status kebal VIP yang aktif!');
            if (player.points < 1000) return msg.reply(`💸 Poinmu tidak cukup! Harga Kebal VIP adalah 1000 poin.\nSaldomu saat ini: *${player.points}*`);

            // Kurangi poin 1000, lalu atur waktu kadaluarsa (24 jam x 60 menit x 60 detik x 1000 milidetik)
            player.points -= 1000;
            player.kebalUntil = Date.now() + (24 * 60 * 60 * 1000); 
            
            msg.reply('🛡️ *PEMBELIAN BERHASIL!*\n\nSistem mencatat kamu sebagai *VIP SULTAN*. \nSelama 24 jam ke depan, Admin grup ini TIDAK AKAN BISA melakukan Kick atau Blacklist kepadamu!');
        }

        // ==========================================
// FITUR KHUSUS ADMIN & OWNER (MODERATION)
// ==========================================

// Mengelompokkan perintah admin untuk dicek otoritasnya sekaligus
// Mengelompokkan perintah admin untuk dicek otoritasnya sekaligus
else if (['!tagall', '!kick', '!promote', '!demote', '!tutupgrup', '!bukagrup', '!blacklist', '!bukablacklist', '!on', '!off', '!zoom', '!meet', '!terlarang', '!listterlarang'].includes(command)) {

    // 1. Pastikan perintah ini HANYA di grup
    if (!chat.isGroup) {
        return msg.reply('❌ Perintah moderasi ini hanya bisa dijalankan di dalam grup.');
    }

    // 2. Cek otoritas: Admin Grup ATAU Sudo User (Owner)
    if (!isSenderAdmin && !isSudo) { 
        return msg.reply('❌ Maaf, perintah ini hanya bisa digunakan oleh Admin grup atau Owner.');
    }

    // --- EKSEKUSI PERINTAH ---

    if (command === '!tagall') {
        let text = "📢 *Pengumuman Admin* 📢\n\n";
        let mentions = [];
        for (let p of participants) {
            text += `@${p.id.user} `;
            mentions.push(p.id._serialized);
        }
        await chat.sendMessage(text, { mentions });
    } 
    
    else if (command === '!terlarang') {
        const kataBaru = args[0]?.toLowerCase();
        if (!kataBaru) return msg.reply('⚠️ Masukkan kata yang ingin dilarang.');
        if (daftarKataKasar.includes(kataBaru)) return msg.reply(`⚠️ Kata *${kataBaru}* sudah ada.`);
        daftarKataKasar.push(kataBaru);
        msg.reply(`✅ Berhasil! Kata *${kataBaru}* ditambahkan ke filter RAM.`);
    } 
    
    else if (command === '!listterlarang') {
        let list = "*🚫 DAFTAR KATA TERLARANG SAAT INI:*\n\n";
        daftarKataKasar.forEach((kata, i) => { list += `${i + 1}. ${kata}\n`; });
        msg.reply(list);
    }

    else if (command === '!kick') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
        if (msg.mentionedIds.length > 0) {
            let targetLolos = [];
            let targetHukum = [];

            for (let id of msg.mentionedIds) {
                let targetPlayer = getPlayer(id);
                if (targetPlayer.kebalUntil > Date.now() || sudoUsers.includes(id)) {
                    targetLolos.push(id);
                } else {
                    targetHukum.push(id);
                }
            }

            if (targetLolos.length > 0) {
                msg.reply('⚠️ *TINDAKAN DITOLAK!* ⚠️\nAnggota tersebut memiliki perlindungan (Kebal VIP atau Owner).');
            }

            if (targetHukum.length > 0) {
                await chat.removeParticipants(targetHukum);
                msg.reply('✅ Anggota berhasil dikeluarkan.');
            }
        } else {
            msg.reply('⚠️ Mohon tag orangnya. Contoh: *!kick @Budi*');
        }
    }

    else if (command === '!promote') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
        if (msg.mentionedIds.length > 0) {
            await chat.promoteParticipants(msg.mentionedIds);
            msg.reply('✅ Anggota berhasil dinaikkan menjadi Admin.');
        } else {
            msg.reply('⚠️ Mohon tag orangnya.');
        }
    }

    else if (command === '!demote') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
        if (msg.mentionedIds.length > 0) {
            await chat.demoteParticipants(msg.mentionedIds);
            msg.reply('✅ Jabatan Admin dicabut.');
        } else {
            msg.reply('⚠️ Mohon tag orangnya.');
        }
    }

    else if (command === '!tutupgrup') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
        await chat.setMessagesAdminsOnly(true);
        msg.reply('🔒 *Grup ditutup.* Hanya Admin yang bisa chat.');
    }

    else if (command === '!bukagrup') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
        await chat.setMessagesAdminsOnly(false);
        msg.reply('🔓 *Grup dibuka.* Semua anggota bisa chat kembali.');
    }

    else if (command === '!blacklist') {
        if (!isBotAdmin) return msg.reply('❌ Bot harus Admin untuk menghapus pesan.');
        if (msg.mentionedIds.length > 0) {
            let idTarget = msg.mentionedIds[0];
            let targetPlayer = getPlayer(idTarget);
            if (targetPlayer.kebalUntil > Date.now() || sudoUsers.includes(idTarget)) {
                return msg.reply('⚠️ Anggota ini kebal/Owner!');
            }
            if (!blacklistedUsers.includes(idTarget)) {
                blacklistedUsers.push(idTarget);
            }
            msg.reply('🔇 Berhasil diblacklist.');
        } else {
            msg.reply('⚠️ Tag orangnya!');
        }
    }

    else if (command === '!bukablacklist') {
        if (msg.mentionedIds.length > 0) {
            blacklistedUsers = blacklistedUsers.filter(id => !msg.mentionedIds.includes(id));
            msg.reply('🔊 Blacklist dicabut.');
        } else {
            msg.reply('⚠️ Tag orangnya!');
        }
    }

    else if (command === '!zoom' || command === '!meet') {
        const randomCode = Math.random().toString(36).substring(2, 10);
        const meetLink = `https://meet.jit.si/RapatGrup-${randomCode}`;
        msg.reply(`🎥 *UNDANGAN RAPAT ONLINE*\n\n🔗 ${meetLink}`);
    }

    else if (command === '!off') {
        if (!inactiveGroups.includes(chat.id._serialized)) {
            inactiveGroups.push(chat.id._serialized);
            msg.reply('💤 Bot dimatikan di grup ini.');
        } else {
            msg.reply('⚠️ Bot sudah mati.');
        }
    }

    else if (command === '!on') {
        if (inactiveGroups.includes(chat.id._serialized)) {
            inactiveGroups = inactiveGroups.filter(id => id !== chat.id._serialized);
            msg.reply('🟢 Bot kembali aktif!');
        } else {
            msg.reply('⚠️ Bot sudah aktif.');
        }
    }
} // <--- Penutup blok utama perintah admin
    }
});

client.initialize();