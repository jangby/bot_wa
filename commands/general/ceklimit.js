const premiumHandler = require('../../utils/premiumHandler');

module.exports = {
    name: 'ceklimit',
    description: 'Cek sisa limit harian',
    async execute(client, msg, args, { contact, isOwner }) {
        const userId = contact.id._serialized;
        const status = premiumHandler.getLimitStatus(userId, isOwner);

        const text = `📊 *STATUS LIMIT* 📊

👤 User: ${contact.pushname || contact.number}
🏷️ Status: *${status.status}*
📉 Sisa Limit: *${status.limit} / ${status.max}*

${status.status === 'FREE' ? '_Limit reset setiap hari._\n_Beli Premium agar Unlimited!_' : '_Kamu Sultan! Bebas pakai sepuasnya._'}`;

        await msg.reply(text);
    }
};