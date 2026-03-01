const uang = require('../../utils/uang');

module.exports = {
    name: 'itemsaya',
    description: 'Cek barang di tas beserta cara pakainya',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        const inventory = uang.cekInventory(userId);
        const itemKeys = Object.keys(inventory);

        // Filter item yang jumlahnya > 0
        const myItems = itemKeys.filter(k => inventory[k] > 0);

        if (myItems.length === 0) {
            return msg.reply('🎒 *TAS KOSONG*\nKamu belum punya item apapun. Beli dulu di *!toko*');
        }

        // Database Panduan Singkat (Manual)
        const panduan = {
            // Item Aktif (Perlu Command)
            'tuyul': 'Ketik *!curi @target* untuk mencuri uangnya.',
            'surat': 'Ketik *!menfess 628xxx pesan* untuk kirim pesan rahasia.',
            'bom': 'Ketik *!bom* di grup untuk prank ledakan.',
            'pancingan': 'Ketik *!mancing* untuk mencari uang (Gacha).',
            'petir': 'Ketik *!petir @target* untuk membakar uang lawan.',
            'kotak': 'Ketik *!bukakotak* untuk gacha hadiah misterius.',
            'speaker': 'Ketik *!speaker [pesan]* untuk teriak anonim di grup.',
            'sapu': 'Ketik *!sapu* untuk menghapus 10 pesan terakhir (Bot harus Admin).',
            
            // Item Pasif (Otomatis)
            'perisai': '🛡️ *PASIF:* Otomatis aktif saat kamu di-kick Admin (Anti-Kick).',
            'celengan': '🐖 *PASIF:* Otomatis pecah melindungi uangmu saat ada Tuyul mencuri.',
            'kartu': '🚓 *PASIF:* Otomatis terpakai saat Tuyulmu tertangkap polisi (Bebas Denda).',
            'kacamata': '👓 *PASIF:* Otomatis melihat nama pengirim saat menerima Menfess.',
            'obat': '💊 *PASIF:* Otomatis menambah darah Ayam saat main *!sambungayam*.',
            'cincin': '💍 *PASIF:* Hiasan Sultan. Tidak ada efek, cuma buat pamer.'
        };

        let text = `🎒 *ISI TAS SAYA* 🎒\n\n`;

        myItems.forEach((item, index) => {
            const jumlah = inventory[item];
            const namaItem = item.toUpperCase();
            const caraPakai = panduan[item] || 'Simpanan koleksi.';

            text += `${index + 1}. *${namaItem}* (Jml: ${jumlah})\n   💡 ${caraPakai}\n\n`;
        });

        text += `_Gunakan item dengan bijak!_`;

        msg.reply(text);
    }
};