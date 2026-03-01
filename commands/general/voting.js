const { Poll } = require('whatsapp-web.js');

module.exports = {
    name: 'voting',
    description: 'Buat voting / polling',
    async execute(client, msg, args) {
        const text = args.join(' ');
        if (!text.includes('|')) {
            return msg.reply('❌ Format: *!voting Pertanyaan | Opsi1 | Opsi2*\nContoh: *!voting Makan apa? | Bakso | Mie Ayam*');
        }

        const split = text.split('|').map(s => s.trim());
        const question = split[0];
        const options = split.slice(1);

        if (options.length < 2) return msg.reply('❌ Minimal 2 opsi jawaban!');

        try {
            const poll = new Poll(question, options);
            await client.sendMessage(msg.from, poll);
        } catch (error) {
            console.error(error);
            msg.reply('❌ Gagal membuat voting. Pastikan WA kamu support fitur Poll.');
        }
    }
};