module.exports = {
    name: 'daftar',
    description: 'Menampilkan daftar fitur untuk Private Chat',
    type: 'general', // Wajib agar bisa diakses di PC
    async execute(client, msg, args) {
        
        // 1. Array untuk menampung command yang diizinkan
        let generalCommands = [];
        
        // Command bawaan sistem yang juga bisa diakses di PC (Berdasarkan index.js Anda)
        const coreCommands = ['menu', 'daftarpremium', 'owner', 'premium'];

        // 2. Loop semua command yang ada di memori bot
        client.commands.forEach((cmd) => {
            // Jika command memiliki type 'general' atau termasuk dalam coreCommands
            if (cmd.type === 'general' || coreCommands.includes(cmd.name)) {
                // Hindari duplikasi jika tidak sengaja memasukkan core command ke tipe general
                if (!generalCommands.find(c => c.name === cmd.name)) {
                    generalCommands.push({
                        name: cmd.name,
                        description: cmd.description || 'Tanpa deskripsi'
                    });
                }
            }
        });

        // 3. Urutkan berdasarkan abjad (A-Z) agar rapi
        generalCommands.sort((a, b) => a.name.localeCompare(b.name));

        // 4. Susun Teks Balasan
        let text = `🤖 *DAFTAR MENU PRIVATE CHAT (PC)* 🤖\n\n`;
        text += `Halo! Berikut adalah daftar perintah yang bisa kamu gunakan langsung lewat chat pribadi:\n\n`;
        text += `🛠️ *FITUR TERSEDIA:*\n`;

        // Masukkan daftar command yang sudah disortir ke dalam teks
        generalCommands.forEach((cmd) => {
            text += `> *!${cmd.name}* - ${cmd.description}\n`;
        });

        text += `\n⚠️ *CATATAN:*\n`;
        text += `_Sebagian besar fitur lain (seperti stiker, game, ekonomi) hanya bisa digunakan di dalam *Grup* atau khusus untuk pengguna *Premium*._`;

        // 5. Kirim balasan
        await msg.reply(text);
    }
};