module.exports = {
    name: 'curi',
    description: 'Mencuri saldo user lain',
    async execute(client, msg, args) {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Fitur ini hanya bisa di grup!');

        // 1. Identifikasi Pencuri dan Korban
        const pencuri = msg.author || msg.from; // ID si pengetik perintah
        const mention = await msg.getMentions();
        const korban = mention[0] ? mention[0].id._serialized : null;

        if (!korban) return msg.reply('⚠️ Tag orang yang mau kamu curi saldonya!');
        if (korban === pencuri) return msg.reply('masa nyuri diri sendiri... sedih amat.');

        try {
            // --- BAGIAN DATABASE (Sesuaikan dengan sistemmu) ---
            // Misal fungsi ambil saldo: getSaldo(id) dan simpan saldo: setSaldo(id, jumlah)
            
            let saldoKorban = await db.getSaldo(korban);
            let saldoPencuri = await db.getSaldo(pencuri);

            if (saldoKorban < 100) return msg.reply('Target terlalu miskin, kasihan jangan dicuri.');

            // 2. Tentukan nominal curi (Random 10% - 50%)
            const jumlahCuri = Math.floor(Math.random() * (saldoKorban * 0.5));

            // 3. PROSES PERBAIKAN: Update saldo kedua pihak
            const saldoBaruKorban = saldoKorban - jumlahCuri;
            const saldoBaruPencuri = saldoPencuri + jumlahCuri;

            // 4. Simpan ke Database
            await db.setSaldo(korban, saldoBaruKorban);
            await db.setSaldo(pencuri, saldoBaruPencuri);

            // 5. Beri tahu hasilnya
            await msg.reply(`💰 *Pencurian Berhasil!*\n\nKamu berhasil mencuri *Rp${jumlahCuri}* dari @${korban.split('@')[0]}!\n\nSaldo kamu sekarang: *Rp${saldoBaruPencuri}*`, {
                mentions: [korban]
            });
            await msg.react('💸');

        } catch (error) {
            console.error(error);
            msg.reply('❌ Gagal melakukan aksi kriminal.');
        }
    }
};