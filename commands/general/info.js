module.exports = {
    name: 'info',
    description: 'Menampilkan informasi bot Berkah Transport',
    async execute(client, msg, args) {
        let teks = `*🤖 INFORMASI BOT BERKAH TRANSPORT*\n\n` +
                   `Halo! Saya adalah Asisten Virtual resmi dari *Berkah Transport City Garut* yang dikembangkan untuk melayani Anda 24/7.\n\n` +
                   `*📍 Kantor Pusat:* Jl. Raya Suci No. 123, Garut\n` +
                   `*📞 Layanan Darurat:* 0812-3456-7890\n\n` +
                   `*Daftar Perintah Cepat:*\n` +
                   `🔹 *!pesan* - Memulai pemesanan armada\n` +
                   `🔹 *!harga* - Cek spesifikasi dan daftar harga sewa\n` +
                   `🔹 *!tanya [pertanyaan]* - Bertanya langsung kepada AI kami (Misal: !tanya apakah ada paket wisata?)\n\n` +
                   `Semua fitur layanan pemesanan dapat Anda gunakan sepenuhnya tanpa batasan limit!`;
        
        await msg.reply(teks);
    }
};