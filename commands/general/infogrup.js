module.exports = {
    name: 'infogrup',
    description: 'Melihat informasi grup',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Perintah ini khusus untuk grup!');

        const info = `📊 *INFO GRUP*
        
🏷️ Nama: *${chat.name}*
📝 Deskripsi: ${chat.description || '-'}
👥 Jumlah Anggota: *${chat.participants.length} Orang*
📅 Dibuat Pada: ${chat.createdAt.toLocaleString()}

_Gunakan !tagall untuk memanggil semua anggota._`;

        await msg.reply(info);
    }
};