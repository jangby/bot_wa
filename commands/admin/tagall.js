module.exports = {
    name: 'tagall',
    description: 'Mention semua anggota grup',
    async execute(client, msg, args, { chat, isAdmin, isOwner }) {
        if (!chat.isGroup) return msg.reply('❌ Perintah ini hanya untuk grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya Admin yang boleh pakai fitur ini!');

        let text = `📢 *PERHATIAN SEMUA* 📢\n\n`;
        let mentions = [];

        for (let participant of chat.participants) {
            text += `@${participant.id.user} `;
            mentions.push(participant.id._serialized);
        }

        await chat.sendMessage(text, { mentions });
    }
};