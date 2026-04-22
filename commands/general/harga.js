module.exports = {
    name: 'harga',
    description: 'Menampilkan daftar harga sewa mobil Berkah Transport',
    async execute(client, msg, args) {
        let teksHarga = `*DAFTAR HARGA SEWA MOBIL - BERKAH TRANSPORT*\n\n` +
                        `🚘 *Innova Reborn* (7 Seat)\n` +
                        `Harga: Rp 850.000 / hari\n` +
                        `Fasilitas: Sopir + BBM\n\n` +
                        `🚘 *Avanza Veloz* (7 Seat)\n` +
                        `Harga: Rp 450.000 / hari\n` +
                        `Fasilitas: Lepas Kunci\n\n` +
                        `🚘 *Hiace Commuter* (14 Seat)\n` +
                        `Harga: Rp 1.200.000 / hari\n` +
                        `Fasilitas: Sopir + BBM\n\n` +
                        `Ketik *!tanya [pertanyaan]* untuk mengobrol langsung dengan AI asisten kami terkait fasilitas atau ketersediaan unit.`;
        
        await msg.reply(teksHarga);
    }
};