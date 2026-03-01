module.exports = {
    name: 'reminder',
    description: 'Pasang pengingat waktu',
    async execute(client, msg, args) {
        if (args.length < 2) {
            return msg.reply('❌ Format: *!reminder [waktu] [pesan]*\nContoh: *!reminder 10m Rapat Zoom*');
        }

        const waktuInput = args[0].toLowerCase();
        const pesan = args.slice(1).join(' ');

        // Regex untuk mengambil angka dan satuan (s/m/h)
        const match = waktuInput.match(/^(\d+)([smh])$/);
        if (!match) return msg.reply('❌ Format waktu salah! Gunakan s (detik), m (menit), h (jam).');

        const angka = parseInt(match[1]);
        const satuan = match[2];
        let ms = 0;

        if (satuan === 's') ms = angka * 1000;
        else if (satuan === 'm') ms = angka * 60 * 1000;
        else if (satuan === 'h') ms = angka * 60 * 60 * 1000;

        // Batas maksimal 24 jam
        if (ms > 86400000) return msg.reply('⚠️ Maksimal pengingat adalah 24 jam.');

        msg.reply(`✅ Pengingat dipasang! Saya akan ingatkan "*${pesan}*" dalam ${angka}${satuan}.`);

        // Timer
        setTimeout(async () => {
            const chat = await msg.getChat();
            // Mention user yang membuat reminder
            const contact = await msg.getContact();
            
            await chat.sendMessage(`⏰ *REMINDER!* ⏰\n\nHalo @${contact.id.user}, waktunya: *"${pesan}"*`, {
                mentions: [contact.id._serialized]
            });
        }, ms);
    }
};