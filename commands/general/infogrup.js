module.exports = {
    name: 'infogrup',
    description: 'Melihat informasi grup dan ID grup',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) return msg.reply('❌ Perintah ini khusus untuk grup!');

        const info = `📊 *INFO GRUP*
        
🆔 ID Grup: *${chat.id._serialized}*
🏷️ Nama: *${chat.name}*
📝 Deskripsi: ${chat.description || '-'}
👥 Jumlah Anggota: *${chat.participants.length} Orang*
📅 Dibuat Pada: ${chat.createdAt.toLocaleString()}

_Gunakan ID di atas untuk daftar pengecualian (whitelist) jika diperlukan._`;

        await msg.reply(info);
    }
};