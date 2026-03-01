const config = require('../../config');

module.exports = {
    name: 'daftarpremium',
    description: 'Info cara berlangganan Premium (Akses Bot di PC)',
    async execute(client, msg, args) {
        const text = `👑 *LAYANAN PREMIUM BOT* 👑

Ingin pakai bot sepuasnya di *Chat Pribadi (PC)* tanpa ganggu grup?
Yuk berlangganan Premium!

💰 *HARGA:* Rp 5.000 / Hari

💳 *METODE PEMBAYARAN:*
• DANA: 085603551478
• QRIS: (Minta ke Owner)

📝 *CARA DAFTAR:*
1. Transfer sesuai nominal.
2. Kirim bukti transfer ke Owner.
3. Chat Owner:
   _"Kak saya sudah transfer, tolong aktifkan premium untuk nomor ini."_

📞 *KONTAK OWNER:*
wa.me/${config.ownerNumber.split('@')[0]}

_Fitur Premium: Bebas buat stiker, steks, dan menu lainnya di PC tanpa batas!_`;

        await msg.reply(text);
    }
};