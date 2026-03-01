const uang = require('../../utils/uang');

module.exports = {
    name: 'toko',
    description: 'Beli item keren',
    async execute(client, msg, args) {
        const text = `🏪 *TOKO SERBA ADA V2* 🏪
Gunakan: *!beli [nama] [jumlah]*

⚔️ *ITEM SERANGAN*
• *Tuyul* (50k): Curi uang orang
• *Petir* (50k): Bakar uang orang (!petir @tag)
• *Bom* (75k): Prank ledakan (!bom)

🛡️ *ITEM BERTAHAN*
• *Perisai* (100k): Anti-Kick Admin
• *Celengan* (15k): Anti-Tuyul (Sekali pakai)
• *Kartu* (30k): Anti-Denda Tuyul

🔧 *UTILITY & FUN*
• *Pancingan* (25k): Cari uang (!mancing)
• *Kotak* (10k): Gacha uang (!bukakotak)
• *Surat* (10k): Menfess (!menfess)
• *Speaker* (5k): Teriak anonim (!speaker pesan)
• *Kacamata* (100k): Intip pengirim menfess
• *Sapu* (75k): Hapus pesan (!sapu)
• *Obat* (20k): Buff HP Ayam
• *Cincin* (500k): Item Sultan (Pamer)

_Cek saldo dulu sebelum belanja!_`;

        msg.reply(text);
    }
};