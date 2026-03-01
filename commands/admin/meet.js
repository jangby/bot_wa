module.exports = {
    name: 'meet',
    description: 'Buat link rapat online (Jitsi)',
    async execute(client, msg, args) {
        // Buat kode acak unik
        const code = Math.random().toString(36).substring(2, 10);
        const link = `https://meet.jit.si/RapatGrup-${code}`;
        
        msg.reply(`🎥 *RUANG RAPAT ONLINE SIAP*\n\nKlik link ini untuk bergabung:\n🔗 ${link}`);
    }
};