module.exports = {
    name: 'pesan',
    description: 'Mulai proses pemesanan mobil secara interaktif',
    async execute(client, msg, args, { contact }) {
        const senderId = contact.id._serialized;
        
        // Memulai sesi untuk user ini dari langkah 1
        global.bookingSessions.set(senderId, { step: 1 });
        
        let teks = `*🌟 PEMESANAN ARMADA BERKAH TRANSPORT*\n\n` +
                   `Silakan pilih armada yang ingin disewa:\n` +
                   `*1.* Innova Reborn (Rp 850.000/hari)\n` +
                   `*2.* Avanza Veloz (Rp 450.000/hari)\n` +
                   `*3.* Hiace Commuter (Rp 1.200.000/hari)\n\n` +
                   `👉 Balas dengan *angka* (1, 2, atau 3).\n` +
                   `❌ Ketik *batal* kapan saja untuk menghentikan proses.`;
        
        await msg.reply(teks);
    }
};