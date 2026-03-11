/**
 * Fitur: Add Saldo
 * Deskripsi: Menambahkan saldo ke anggota lain (Khusus Owner)
 */

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    async execute(client, msg, args) {
        // --- 1. KONFIGURASI OWNER ---
        // Masukkan nomor kamu di sini (hanya angka, tanpa +, tanpa spasi)
        const ownerNomor = '6285136468097'; 
        
        // Mengambil ID pengirim (msg.author untuk grup, msg.from untuk chat pribadi)
        const senderId = msg.author || msg.from;
        // Membersihkan ID agar hanya tersisa angka nomor HP saja
        const senderNumber = senderId.split('@')[0]; 

        // --- 2. CEK OTORITAS ---
        if (senderNumber !== ownerNomor) {
            return msg.reply('❌ Akses Ditolak! Fitur ini hanya untuk Owner Bot.');
        }

        // --- 3. AMBIL DATA DARI ARGUMEN ---
        // Mendapatkan user yang di-tag (mention)
        const mentions = await msg.getMentions();
        const target = mentions[0] ? mentions[0].id._serialized : null;
        
        // Mencari angka nominal di dalam argumen (args)
        const nominal = parseInt(args.find(arg => !isNaN(arg) && !arg.includes('@')));

        // Validasi input
        if (!target || isNaN(nominal)) {
            return msg.reply('⚠️ *Format Salah!*\n\nCara pakai:\n*!addsaldo @nama nominal*\nContoh:\n*!addsaldo @fulan 50000*');
        }

        if (nominal <= 0) {
            return msg.reply('⚠️ Nominal harus lebih dari 0!');
        }

        try {
            // --- 4. PROSES DATABASE ---
            /** * CATATAN: Pastikan fungsi db.getSaldo dan db.setSaldo 
             * sesuai dengan sistem database yang kamu gunakan.
             */
            let saldoSekarang = await db.getSaldo(target) || 0;
            let saldoBaru = saldoSekarang + nominal;

            // Simpan saldo terbaru ke database
            await db.setSaldo(target, saldoBaru);

            // --- 5. BERI FEEDBACK ---
            const targetName = target.split('@')[0];
            const responseText = `✅ *SALDO BERHASIL DITAMBAHKAN*\n\n` +
                                 `👤 *Target:* @${targetName}\n` +
                                 `💰 *Nominal:* +Rp${nominal.toLocaleString('id-ID')}\n` +
                                 `🏦 *Total Saldo:* Rp${saldoBaru.toLocaleString('id-ID')}`;

            await msg.reply(responseText, null, {
                mentions: [target]
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('Error AddSaldo:', error);
            msg.reply('❌ *Terjadi Kesalahan!* Gagal memperbarui saldo di database.');
        }
    }
};