/**
 * Fitur: Add Saldo (Connected to Config)
 */

const config = require('../../config.js'); // Pastikan path/jalur ke file config.js sudah benar

module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    async execute(client, msg, args) {
        
        // 1. Ambil ID pengirim
        const sender = msg.author || msg.from;

        // 2. Cek apakah ID pengirim ada di dalam daftar sudoUsers atau ownerNumber
        // Kita cek menggunakan .includes() agar semua nomor di list sudoUsers diizinkan
        const isOwner = config.ownerNumber === sender || config.sudoUsers.includes(sender);

        if (!isOwner) {
            // Debugging (Opsional): Hapus tanda // di bawah jika ingin melihat ID yang terdeteksi di terminal
            // console.log("ID Terdeteksi:", sender); 
            return msg.reply('❌ Fitur ini khusus untuk Owner/Sudo Bot!');
        }

        // 3. Ambil data dari tag (mention) dan nominal
        const mentions = await msg.getMentions();
        const target = mentions[0] ? mentions[0].id._serialized : null;
        const nominal = parseInt(args.find(arg => !isNaN(arg) && !arg.includes('@')));

        if (!target || isNaN(nominal)) {
            return msg.reply('⚠️ Format salah!\nContoh: *!addsaldo @nama 1000000*');
        }

        try {
            // 4. Proses Update Saldo (Sesuaikan dengan fungsi database kamu)
            let saldoSekarang = await db.getSaldo(target) || 0;
            let saldoBaru = saldoSekarang + nominal;

            await db.setSaldo(target, saldoBaru);

            // 5. Beri laporan sukses
            await msg.reply(`✅ *BERHASIL TAMBAH SALDO*\n\nTarget: @${target.split('@')[0]}\nNominal: +Rp${nominal.toLocaleString('id-ID')}\nTotal Saldo: Rp${saldoBaru.toLocaleString('id-ID')}`, {
                mentions: [target]
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('AddSaldo Error:', error);
            msg.reply('❌ Gagal mengakses database saldo.');
        }
    }
};