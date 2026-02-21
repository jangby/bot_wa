const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
let blacklistedUsers = [];
let inactiveGroups = [];
let playersData = {};

// Fungsi untuk membuat/mengambil data pemain (otomatis dapat 100 poin pertama)
function getPlayer(id) {
    if (!playersData[id]) {
        playersData[id] = { points: 100, kebalUntil: 0 }; 
    }
    return playersData[id];
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

    // PASTIKAN PESAN HANYA DIPROSES JIKA BERASAL DARI GRUP
    if (chat.isGroup) {
        const senderId = msg.author || msg.from;
        const participants = chat.participants;
        
        // 1. Dapatkan data detail kontak si pengirim pesan
        const senderContact = await msg.getContact();
        const senderNumber = senderContact.number; 
        
        // Format standar ID WhatsApp (contoh: 628123456789@c.us)
        const standardSenderId = `${senderNumber}@c.us`;

        // ==========================================
        // 🛑 SISTEM EKSEKUSI BLACKLIST 
        // ==========================================
        // Mengecek apakah ID pengirim ada di dalam daftar blacklist
        if (blacklistedUsers.includes(standardSenderId)) {
            // Jika Bot adalah admin, bot berhak menghapus pesan orang lain
            if (isBotAdmin) {
                try {
                    // Delete for everyone
                    await msg.delete(true); 
                } catch (error) {
                    console.log("Gagal menghapus pesan blacklist:", error);
                }
            }
            // Hentikan proses di sini! Bot tidak akan merespons perintah apapun dari orang ini
            return; 
        }
        // ==========================================

        // 3. Cari pengirim di daftar anggota... (lanjutan kode Anda yang lama)
        const sender = participants.find(p => p.id.user === senderNumber);
        
        // 4. Tentukan apakah dia admin
        const isSenderAdmin = sender?.isAdmin || sender?.isSuperAdmin;

        // ==========================================
        // 🔍 SISTEM DETEKSI (Bisa Anda hapus nanti jika sudah sukses)
        // ==========================================
        console.log("-----------------------------------------");
        console.log("ID Samaran (@lid):", senderId);
        console.log("Nomor Asli       :", senderNumber);
        console.log("Status Admin     :", isSenderAdmin ? "YA, DIA ADMIN ✅" : "BUKAN ADMIN ❌");
        console.log("-----------------------------------------");

        // 2. Cek apakah BOT adalah Admin (Syarat wajib untuk kick/promote/setting grup)
        const botId = client.info.wid._serialized;
        const bot = participants.find(p => p.id._serialized === botId);
        const isBotAdmin = bot?.isAdmin || bot?.isSuperAdmin;

        // Memisahkan kata pertama (perintah) dan sisanya
        const args = msg.body.trim().split(/ +/);
        const command = args.shift().toLowerCase();

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

        if (command === '!ping') {
            msg.reply('Pong! Bot aktif dan siap melayani.');
        }

        else if (command === '!menu' || command === '!help') {
            const menu = `*🤖 MENU BOT GRUP 🤖*

*👤 Untuk Semua Anggota:*
• *!ping* : Cek status bot
• *!menu* : Tampilkan daftar perintah ini
• *!infogrup* : Info seputar grup
• *!admin* : Tag semua admin grup
• *!sticker* : Kirim gambar dengan caption !sticker untuk membuat stiker

*👑 Khusus Admin:*
• *!tagall* : Mention semua anggota
• *!kick @user* : Keluarkan anggota
• *!promote @user* : Jadikan anggota sebagai admin
• *!demote @user* : Turunkan admin jadi anggota biasa
• *!tutupgrup* : Hanya admin yang bisa kirim pesan
• *!bukagrup* : Semua anggota bisa kirim pesan`;
            msg.reply(menu);
        }

        else if (command === '!infogrup') {
            msg.reply(`*Info Grup*\nNama: ${chat.name}\nDeskripsi: ${chat.description || 'Tidak ada deskripsi'}\nJumlah Anggota: ${participants.length} orang`);
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
        // FITUR KHUSUS ADMIN (MODERATION)
        // ==========================================

        // Mengelompokkan perintah admin untuk dicek otoritasnya sekaligus
        else if (['!tagall', '!kick', '!promote', '!demote', '!tutupgrup', '!bukagrup', '!blacklist', '!bukablacklist', '!on', '!off'].includes(command)) {
            
            // Jika yang mengirim BUKAN admin, tolak!
            if (!isSenderAdmin) {
                return msg.reply('❌ Maaf, perintah ini hanya bisa digunakan oleh Admin grup.');
            }

            // --- Eksekusi Perintah Admin ---

            if (command === '!tagall') {
                let text = "📢 *Pengumuman Admin* 📢\n\n";
                let mentions = [];
                for (let p of participants) {
                    text += `@${p.id.user} `;
                    mentions.push(p.id._serialized);
                }
                await chat.sendMessage(text, { mentions });
            }

            else if (command === '!kick') {
                if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
                if (msg.mentionedIds.length > 0) {
                    
                    let targetLolos = [];
                    let targetHukum = [];

                    // Mengecek satu per satu orang yang di-tag
                    for (let id of msg.mentionedIds) {
                        let targetPlayer = getPlayer(id);
                        if (targetPlayer.kebalUntil > Date.now()) {
                            targetLolos.push(id); // Masukkan ke daftar orang kebal
                        } else {
                            targetHukum.push(id); // Masukkan ke daftar orang biasa
                        }
                    }

                    // Jika ada orang kebal yang mau di-kick, marahi adminnya
                    if (targetLolos.length > 0) {
                        msg.reply('⚠️ *TINDAKAN DITOLAK BOT!* ⚠️\nAdmin tidak bisa mengeluarkan anggota ini karena ia sedang menggunakan perlindungan *KEBAL VIP SULTAN!*');
                    }

                    // Eksekusi kick hanya untuk orang biasa
                    if (targetHukum.length > 0) {
                        await chat.removeParticipants(targetHukum);
                        msg.reply('✅ Anggota biasa berhasil dikeluarkan dari grup.');
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
                    msg.reply('⚠️ Mohon tag orangnya. Contoh: *!promote @Budi*');
                }
            }

            else if (command === '!demote') {
                if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
                if (msg.mentionedIds.length > 0) {
                    await chat.demoteParticipants(msg.mentionedIds);
                    msg.reply('✅ Jabatan Admin berhasil dicabut dari anggota tersebut.');
                } else {
                    msg.reply('⚠️ Mohon tag orangnya. Contoh: *!demote @Budi*');
                }
            }

            else if (command === '!tutupgrup') {
                if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
                await chat.setMessagesAdminsOnly(true);
                msg.reply('🔒 *Grup ditutup.* Saat ini hanya Admin yang bisa mengirim pesan.');
            }

            else if (command === '!bukagrup') {
                if (!isBotAdmin) return msg.reply('❌ Bot harus dijadikan Admin terlebih dahulu.');
                await chat.setMessagesAdminsOnly(false);
                msg.reply('🔓 *Grup dibuka.* Semua anggota kini bisa mengirim pesan kembali.');
            }

            // FITUR BLACKLIST
            else if (command === '!blacklist') {
                if (!isBotAdmin) return msg.reply('❌ Bot harus menjadi Admin untuk bisa menghapus pesan.');
                if (msg.mentionedIds.length > 0) {
                    
                    // Mengecek apakah targetnya kebal
                    let idTarget = msg.mentionedIds[0];
                    let targetPlayer = getPlayer(idTarget);

                    if (targetPlayer.kebalUntil > Date.now()) {
                        return msg.reply('⚠️ *TINDAKAN DITOLAK BOT!* ⚠️\nKamu tidak bisa mem-blacklist anggota ini karena ia memiliki status *KEBAL VIP SULTAN!*');
                    }

                    // Jika tidak kebal, jalankan blacklist
                    if (!blacklistedUsers.includes(idTarget)) {
                        blacklistedUsers.push(idTarget);
                    }
                    msg.reply('🔇 Anggota berhasil diblacklist. Pesannya akan otomatis terhapus.');
                } else {
                    msg.reply('⚠️ Mohon tag orangnya. Contoh: *!blacklist @Budi*');
                }
            }

            // FITUR BUKA BLACKLIST
            else if (command === '!bukablacklist') {
                if (msg.mentionedIds.length > 0) {
                    // Menyaring/menghapus ID yang di-tag dari daftar blacklist
                    blacklistedUsers = blacklistedUsers.filter(id => !msg.mentionedIds.includes(id));
                    msg.reply('🔊 Blacklist dicabut.\nAnggota tersebut kini bisa mengirim pesan kembali dengan normal.');
                } else {
                    msg.reply('⚠️ Mohon tag orangnya. Contoh: *!bukablacklist @Budi*');
                }
            }

            // FITUR MATIKAN BOT
            else if (command === '!off') {
                // Jika grup ini belum ada di daftar inactive, maka masukkan
                if (!inactiveGroups.includes(chat.id._serialized)) {
                    inactiveGroups.push(chat.id._serialized);
                    msg.reply('💤 Bot berhasil dimatikan di grup ini.\nSemua perintah akan diabaikan sampai Admin mengetik *!on*.');
                } else {
                    msg.reply('⚠️ Bot memang sudah dalam keadaan mati.');
                }
            }

            // FITUR NYALAKAN BOT
            else if (command === '!on') {
                // Jika grup ini ada di daftar inactive, maka hapus dari daftar
                if (inactiveGroups.includes(chat.id._serialized)) {
                    inactiveGroups = inactiveGroups.filter(id => id !== chat.id._serialized);
                    msg.reply('🟢 Bot kembali aktif! Semua fitur dapat digunakan lagi.');
                } else {
                    msg.reply('⚠️ Bot sudah dalam keadaan aktif.');
                }
            }
        }
    }
});

client.initialize();