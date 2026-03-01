module.exports = {
    name: 'cekkhodam',
    description: 'Cek sosok khodam pendampingmu',
    async execute(client, msg, args) {
        const nama = args.join(' ');
        if (!nama) return msg.reply('❌ Masukkan namanya! Contoh: *!cekkhodam Budi*');

        const khodam = [
            'Kulkas 2 Pintu', 'Tutup Botol', 'Cicak Kawin', 'Vario Mber', 
            'Beat Karbu', 'Nyi Blorong', 'Tuyul Mohawk', 'Kuntilanak Merah',
            'Pocong Ngesot', 'Seblak Ceker', 'Martabak Manis', 'Bakwan Jagung',
            'Kucing Oren', 'Harimau Putih', 'Naga Indosiar', 'Elang Botak',
            'Kecoa Terbang', 'Laba-laba Sunda', 'Batu Bata', 'Sapu Lidi'
        ];

        // Pilih acak
        const random = khodam[Math.floor(Math.random() * khodam.length)];
        
        msg.reply(`🔮 *CEK KHODAM* 🔮\n\nNama: ${nama}\nKhodam: *${random}*`);
    }
};