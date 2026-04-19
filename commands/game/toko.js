module.exports = {
    name: 'toko',
    description: 'Beli item keren',
    type: 'game',
    async execute(client, msg, args) {
        const text = `🏪 *TOKO SERBA ADA V2* 🏪
Gunakan: *!beli [nama] [jumlah]*
Contoh: *!beli bom 2* atau *!beli pancingan baja*

⚔️ *ITEM SERANGAN*
• *Tuyul* (50k): Curi uang orang
• *Petir* (50k): Bakar uang orang (!petir @tag)
• *Bom* (75k): Prank ledakan (!bom)

🛡️ *ITEM BERTAHAN*
• *Perisai* (100k): Anti-Kick Admin
• *Celengan* (15k): Anti-Tuyul (Sekali pakai)
• *Kartu* (30k): Anti-Denda Tuyul

🔧 *UTILITY & FUN*
• *Kotak* (10k): Gacha uang (!bukakotak)
• *Surat* (10k): Menfess (!menfess)
• *Speaker* (5k): Teriak anonim (!speaker pesan)
• *Kacamata* (100k): Intip pengirim menfess
• *Sapu* (75k): Hapus pesan (!sapu)
• *Obat* (20k): Buff HP Ayam
• *Cincin* (500k): Item Sultan (Pamer)

🎣 *ALAT PANCING (Level | Harga)*
• *pancingan ranting* (Lv1 | 5k)
• *pancingan bambu* (Lv3 | 10k)
• *pancingan kayu jati* (Lv5 | 25k)
• *pancingan paralon* (Lv10 | 50k)
• *pancingan fiber* (Lv15 | 100k)
• *pancingan fiber pro* (Lv20 | 250k)
• *pancingan karbon* (Lv25 | 500k)
• *pancingan karbon murni* (Lv30 | 1jt)
• *pancingan baja* (Lv40 | 2.5jt)
• *pancingan titanium* (Lv50 | 5jt)
• *pancingan elektro* (Lv60 | 10jt)
• *pancingan poseidon* (Lv70 | 25jt)
• *pancingan kristal* (Lv80 | 50jt)
• *pancingan naga laut* (Lv90 | 100jt)
• *pancingan sultan kosmik* (Lv100 | 500jt)

_Cek saldo dulu sebelum belanja!_`;

        msg.reply(text);
    }
};