module.exports = {
    name: 'seberapa',
    description: 'Cek kadar sifat seseorang',
    async execute(client, msg, args) {
        const text = args.join(' ');
        if (!text) return msg.reply('❌ Format: *!seberapa [sifat] [nama]*\nContoh: *!seberapa gay Budi*');

        const persen = Math.floor(Math.random() * 101);
        
        // Visual Bar
        const full = '█'.repeat(Math.floor(persen / 10));
        const empty = '░'.repeat(10 - Math.floor(persen / 10));
        
        // 🔥 PERBAIKAN: Ambil array ID orang yang di-tag
        const mentions = msg.mentionedIds;

        // Gunakan parameter ke-3 (options) untuk menyertakan data mentions
        // Format: msg.reply(text, chatId (undefined = reply sender), options)
        await msg.reply(`📊 *CEK KADAR* 📊\n\nPertanyaan: Seberapa ${text}?\nHasil: *${persen}%*\n[${full}${empty}]`, undefined, {
            mentions: mentions
        });
    }
};