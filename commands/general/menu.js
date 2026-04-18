module.exports = {
    name: 'menu',
    description: 'Menampilkan daftar lengkap semua fitur dan perintah bot',
    type: 'general',
    async execute(client, msg, args) {
        
        // Membaca nama pengirim jika tersedia
        const contact = await msg.getContact();
        const senderName = contact.pushname || 'Kak';

        const menuText = `
*╭━━━━ 🤖 BOT WA CANGGIH 🤖 ━━━━╮*
*│* Halo, *${senderName}*! 👋
*│* Selamat datang di layanan Bot WhatsApp.
*│* Berikut adalah daftar lengkap fitur kami:
*╰━━━━━━━━━━━━━━━━━━━━━━━╯*

*🛡️ ADMIN & MANAJEMEN GRUP*
• *!blacklist* - Memblokir user/nomor
• *!buka* - Membuka interaksi sistem
• *!bukaabsen* - Membuka sesi absensi
• *!bukablacklist* - Membuka blokir user
• *!bukagrup* - Membuka kunci obrolan grup
• *!demote* - Menurunkan pangkat admin
• *!hapus* - Menghapus pesan tertentu
• *!hidetag* - Tag semua member (tersembunyi)
• *!izinkan* - Memberikan perizinan ke user
• *!izinlab* - Manajemen izin pemakaian lab
• *!kick* - Mengeluarkan member dari grup
• *!meet* - Mengatur link/jadwal meeting
• *!promote* - Menaikkan user menjadi admin
• *!rekapizin* - Menampilkan rekapitulasi izin
• *!server* - Mengecek status/ping server
• *!tagall* - Tag semua member di grup (terlihat)
• *!tolak* - Menolak permohonan izin
• *!tutupabsen* - Menutup sesi absensi aktif
• *!tutupgrup* - Mengunci obrolan grup
• *!warn* - Memberikan peringatan ke member

*📝 ADMINISTRASI & SURAT MENYURAT*
• *!addsurat* - Tambah format nomor surat baru
• *!arsipsurat* - Melihat daftar arsip surat
• *!buatdocx* - Generate file template Word (.docx)
• *!carisurat* - Mencari surat spesifik
• *!cetaksurat* - Mencetak surat jadi dokumen
• *!daftarsurat* - List antrean/daftar surat
• *!doksurat* - Manajemen dokumen surat
• *!editsurat* - Mengedit parameter surat
• *!getsurat* - Menarik detail dari satu surat
• *!hapussurat* - Menghapus data/arsip surat
• *!jenissurat* - Melihat list kategori surat
• *!rekapsurat* - Rekapitulasi dokumen harian
• *!setnomorsurat* - Set penomoran otomatis
• *!suratbebas* - Buat surat tanpa template ketat
• *!templates* - Lihat template docx (Yayasan/Pesantren)

*🕌 ISLAMI & RELIGI*
• *!hadits* - Mencari dan membaca hadits
• *!juzperkata* - Tafsir & terjemahan Al-Quran per kata
• *!quran* - Baca ayat suci Al-Quran
• *!sholat* - Info jadwal sholat harian
• *!tafsir* - Baca tafsir ayat
• *!tafsirjuz* - Tafsir lengkap per Juz (Bisa cetak .docx)

*🛠️ MEDIA & UTILITAS UMUM*
• *!afk* - Pasang status AFK (Sedang sibuk)
• *!ai* - Chatbot AI Pintar (Tanya apa saja)
• *!anime* - Cari informasi/detail anime
• *!balas* - Balas pesan otomatis
• *!catatan* - Menyimpan catatan pribadi
• *!cekresi* - Melacak resi paket pengiriman
• *!convert* - Konversi jenis format file
• *!cuaca* - Informasi prakiraan cuaca terkini
• *!daftar* - Mendaftar ke database bot
• *!gambar* - Cari gambar otomatis (Image Search)
• *!gempa* - Info gempa bumi terkini (BMKG)
• *!hadir* - Absensi kehadiran manual
• *!hapusbg* - Menghapus background foto
• *!ig* - Download video/foto Instagram
• *!infogrup* - Melihat statistik dan info grup
• *!jadwalbola* - Jadwal pertandingan sepak bola
• *!lirik* - Cari lirik lagu lengkap
• *!loker* - Cari lowongan pekerjaan
• *!addloker* - Tambah data loker ke sistem
• *!delloker* - Hapus data loker
• *!ocr* - Ambil teks dari sebuah gambar
• *!ping* - Cek respon kecepatan bot
• *!play* - Putar / download musik lagu
• *!qrcode* - Generate QR Code dari teks
• *!quotes* - Kumpulan kutipan & kata bijak
• *!rangkum* - Merangkum teks/artikel panjang
• *!reminder* - Pasang pengingat (Alarm)
• *!resep* - Cari resep masakan nusantara/dunia
• *!search* - Pencarian web Google
• *!simpan* - Menyimpan lampiran/file
• *!steks* - Pembuat stiker teks sederhana
• *!sticker* - Ubah gambar jadi stiker statis
• *!stikerteks* - Stiker teks video / animasi bergerak
• *!stofoto* - Ubah stiker WA menjadi foto/gambar
• *!stop* - Menghentikan layanan/proses bot
• *!tiktok* - Download video TikTok (Tanpa Watermark)
• *!tovn* - Ubah video/audio menjadi Voice Note (VN)
• *!translate* - Penerjemah bahasa (Google Translate)
• *!tts* - Ubah teks menjadi suara (Text-To-Speech)
• *!voting* - Sistem pemungutan suara grup
• *!wiki* - Cari ensiklopedia di Wikipedia

*💰 EKONOMI & AKUN*
• *!ceklimit* - Cek sisa kuota limit harian
• *!daftarpremium* - Info mendaftar akses premium
• *!mutasi* - Cek histori mutasi saldo/uang
• *!premium* - Cek status langganan premium
• *!saldo* - Cek saldo dompet digital bot
• *!topup* - Isi ulang saldo bot

*🎮 GAME & PERMAINAN INTERAKTIF*
• *!beli* - Beli item di toko game
• *!bom* - Game ranjau (Tebak Bom)
• *!bukakotak* - Buka kotak misteri (Gacha)
• *!curi* - Curi aset / item pemain lain
• *!itemsaya* - Cek inventory item game
• *!kuis* - Kuis pengetahuan umum
• *!magicchess* - Game catur (Magic Chess)
• *!mancing* - Game simulator memancing
• *!nyerah* - Menyerah dari game yang aktif
• *!petir* - Game Zeus (Petir Slot)
• *!raid* - Mode serbu boss (Raid)
• *!sambungayam* - Game sambung ayam virtual
• *!sambungkata* - Game asah otak sambung kata
• *!sapu* - Game sapu ranjau (Minesweeper)
• *!speaker* - Game tebak audio/suara
• *!tebak* - Game tebakan misteri
• *!tebakfoto* - Game tebak wajah/foto tersembunyi
• *!tebakgambar* - Game logika tebak gambar
• *!toko* - Buka katalog toko game
• *!ttt* - Game Tic-Tac-Toe (XOXO)

*🥳 FUN & INTERAKSI SOSIAL*
• *!bukakapsul* - Buka kapsul waktu yang tersimpan
• *!cekkhodam* - Cek khodam lucu/hiburan
• *!gelar* - Generate gelar acak untuk teman
• *!jomblo* - Cek status kejombloan
• *!kapsulwaktu* - Buat pesan rahasia kapsul waktu
• *!leaderboard* - Papan peringkat level/saldo
• *!level* - Cek level XP akun Anda
• *!meme* - Generate gambar meme acak
• *!menfess* - Kirim pesan menfess/rahasia
• *!patungan* - Fitur hitung patungan (Split bill)
• *!roasting* - Roasting member (Candaan)
• *!seberapa* - Kalkulator "Seberapa..."
• *!setjomblo* - Update status jomblo
• *!setultah* - Atur tanggal ulang tahun
• *!siapa* - Game "Siapa yang paling..."
• *!ultah* - Cek siapa yang ulang tahun hari ini

*👑 OWNER & DEVELOPER (Akses Terbatas)*
• *!addjadwal* - Menambah jadwal sistem
• *!addpremium* - Beri akses premium ke user
• *!addsaldo* - Suntik saldo ke akun member
• *!fitur* - Manajemen dan pengaturan status fitur
• *!off* - Matikan bot (Sleep mode)
• *!on* - Nyalakan bot (Wake up mode)

*💡 Cara Penggunaan:*
Untuk menggunakan fitur, cukup ketik perintah sesuai teks yang dicetak tebal. Anda bisa menambahkan parameter jika diperlukan.
*Contoh:* \`!ai Tolong buatkan puisi tentang pendidikan\`
`;

        try {
            // Berikan sedikit indikator "typing" agar terlihat natural sebelum menu panjang dikirim
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            // Mengirim menu lengkap ke user
            await msg.reply(menuText.trim());

        } catch (error) {
            console.error('Error saat menampilkan menu:', error);
            msg.reply('❌ Terjadi kesalahan saat memuat menu bot.');
        }
    }
};