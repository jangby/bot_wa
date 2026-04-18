const uang = require('../../utils/uang');

module.exports = {
    name: 'addmodal',
    description: 'Membagikan modal/saldo ke seluruh anggota grup',
    type: 'owner',
    async execute(client, msg, args, { chat, isOwner }) {
        
        // 1. Validasi Keamanan: Pastikan hanya Owner yang bisa pakai
        if (!isOwner) {
            return msg.reply('⛔ *AKSES DITOLAK* ⛔\nPerintah ini khusus untuk Owner bot!');
        }

        // 2. Validasi Tempat: Pastikan dipakai di dalam Grup, bukan Private Chat (PC)
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya bisa digunakan di dalam grup!');
        }

        // 3. Validasi Input Nominal
        if (args.length === 0) {
            return msg.reply('❌ Masukkan jumlah uang yang ingin dibagikan!\nContoh: *!addmodal 50000*');
        }

        const nominal = parseInt(args[0]);

        if (isNaN(nominal) || nominal <= 0) {
            return msg.reply('❌ Nominal harus berupa angka bulat dan lebih dari 0!');
        }

        try {
            // Beri reaksi jam pasir tanda bot sedang memproses data
            await msg.react('⏳');
            
            let successCount = 0;
            const botId = client.info.wid._serialized;
            
            // 4. Looping untuk membagikan saldo ke seluruh anggota grup
            for (let participant of chat.participants) {
                const targetId = participant.id._serialized;
                
                // Bot tidak perlu menerima uang
                if (targetId === botId) continue;

                // Tambahkan saldo menggunakan fungsi bawaan utilitas kamu
                uang.addSaldo(targetId, nominal, 'Modal Grup dari Owner');
                successCount++;
            }

            // 5. Beri laporan sukses
            await msg.react('✅');
            const formatUang = uang.formatRupiah ? uang.formatRupiah(nominal) : `Rp ${nominal}`;
            
            await msg.reply(`🎉 *BAGI-BAGI MODAL SUKSES!* 🎉\n\nSebanyak *${successCount} anggota* grup ini telah otomatis menerima suntikan dana masing-masing sebesar *${formatUang}* dari Owner.\n\nSilakan cek menggunakan perintah *!saldo*.`);
            
        } catch (error) {
            console.error('Error eksekusi Add Modal:', error);
            msg.reply('❌ Terjadi kesalahan saat mencoba membagikan saldo ke anggota grup.');
        }
    }
};