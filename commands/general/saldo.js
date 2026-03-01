const uang = require('../../utils/uang');

module.exports = {
    name: 'saldo',
    description: 'Cek uang dan barang milikmu',
    async execute(client, msg, args, { contact }) {
        const userId = contact.id._serialized;
        const saldo = uang.cekSaldo(userId);
        const inv = uang.cekInventory(userId);

        // Format Inventory
        let invText = '';
        const items = Object.keys(inv);
        if (items.length === 0) {
            invText = '- (Tas Kosong)';
        } else {
            items.forEach(item => {
                const namaBarang = item.charAt(0).toUpperCase() + item.slice(1);
                invText += `📦 ${namaBarang}: ${inv[item]} pcs\n`;
            });
        }

        const text = `💰 *DOMPET & TAS* 💰
        
👤 Nama: ${contact.pushname || contact.number}
💵 Uang: *${uang.formatRupiah(saldo)}*

🎒 *INVENTORY:*
${invText}

_Gunakan uangmu di !toko_`;

        msg.reply(text);
    }
};