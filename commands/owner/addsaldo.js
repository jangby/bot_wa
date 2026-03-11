module.exports = {
    name: 'addsaldo',
    description: 'Owner menambahkan saldo ke user tertentu',
    async execute(client, msg, args) {
        // 1. PENGATURAN OWNER (Ganti dengan nomor WhatsApp kamu)
        const ownerNumber = '628xxxxxxxxxx@c.us'; // WAJIB GANTI DENGAN NOMOR KAMU
        
        const sender = msg.author || msg.from;

        // 2. Cek apakah yang mengetik adalah Owner
        if (sender !== ownerNumber) {
            return msg.reply('❌ Fitur ini khusus untuk Owner Bot!');
        }

        // 3. Ambil data dari tag (mention) dan nominal
        const mention = await msg.getMentions();
        const target = mention[0] ? mention[0].id._serialized : null;
        const nominal = parseInt(args.find(arg => !arg.includes('@'))); // Ambil angka dari argumen

        // Validasi input
        if (!target || isNaN(nominal)) {
            return msg.reply('⚠️ Format salah!\nContoh: *!addsaldo @nama 1000000*');
        }

        try {
            // 4. Proses penambahan saldo di database
            // Misal: db.getSaldo(id) dan db.setSaldo(id, jumlah)
            let saldoSekarang = await db.getSaldo(target);
            let saldoBaru = saldoSekarang + nominal;

            await db.setSaldo(target, saldoBaru);

            // 5. Beri laporan sukses
            await msg.reply(`✅ *BERHASIL TAMBAH SALDO*\n\nTarget: @${target.split('@')[0]}\nNominal: +Rp${nominal.toLocaleString()}\nTotal Saldo: Rp${saldoBaru.toLocaleString()}`, {
                mentions: [target]
            });
            
            await msg.react('💰');

        } catch (error) {
            console.error('AddSaldo Error:', error);
            msg.reply('❌ Terjadi kesalahan saat mengakses database.');
        }
    }
};