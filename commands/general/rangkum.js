module.exports = {
    name: 'rangkum',
    description: 'Merangkum percakapan terakhir di grup menggunakan AI',
    async execute(client, msg, args, { chat, contact }) {
        // 1. Pastikan perintah ini hanya berjalan di dalam Grup
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah *!rangkum* hanya bisa digunakan di dalam Grup!');
        }

        // Beri tahu user bahwa bot sedang memproses (karena baca chat & AI butuh waktu)
        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu sebentar ya, bot sedang membaca dan merangkum percakapan grup... 🕵️‍♂️');

        try {
            // 2. Ambil riwayat pesan terakhir (misal 50 pesan terakhir)
            const limitPesan = 50; 
            const messages = await chat.fetchMessages({ limit: limitPesan });

            // 3. Format pesan agar mudah dipahami AI (Nama: Isi Pesan)
            let chatHistory = [];
            for (let m of messages) {
                // Abaikan pesan jika tidak ada teksnya (misal murni stiker/gambar tanpa caption)
                if (!m.body) continue;
                
                // Coba ambil nama pengirim (pushname), jika tidak ada pakai nomor WA
                let senderName = "Member";
                try {
                    const senderContact = await m.getContact();
                    senderName = senderContact.pushname || senderContact.number || "Member";
                } catch (e) {
                    // Abaikan jika gagal ambil kontak
                }

                chatHistory.push(`${senderName}: ${m.body}`);
            }

            // Jika pesan yang berupa teks terlalu sedikit
            if (chatHistory.length < 5) {
                await loadingMsg.delete(true).catch(()=>{}); // Hapus pesan loading
                return msg.reply('⚠️ Belum ada cukup percakapan teks untuk dirangkum.');
            }

            // Gabungkan array menjadi satu paragraf panjang
            const textPercakapan = chatHistory.join('\n');

            // 4. Susun Prompt (Instruksi) untuk Ollama
            const promptAI = `Kamu adalah asisten grup WhatsApp yang pintar. Tugasmu adalah membaca log percakapan grup berikut dan membuatkan rangkuman yang padat, singkat, dan jelas menggunakan bahasa Indonesia yang santai tapi sopan. Sebutkan poin-poin penting atau topik apa saja yang sedang dibahas, serta siapa yang dominan membahasnya jika perlu.\n\nBerikut adalah log percakapannya:\n\n${textPercakapan}\n\nBerikan rangkumanmu sekarang:`;

            // 5. Tembak ke API lokal Ollama
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3', // Sesuaikan dengan model yang kamu pakai
                    prompt: promptAI,
                    stream: false // Tunggu sampai AI selesai ngetik semua
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const hasilRangkuman = data.response;

            // 6. Kirim Hasil Rangkuman
            await msg.reply(`*📊 RANGKUMAN GRUP (Top ${limitPesan} Pesan)*\n\n${hasilRangkuman}`);
            await msg.react('✅');

        } catch (error) {
            console.error('Error saat merangkum:', error);
            await msg.react('❌');
            await msg.reply('Maaf, AI gagal merangkum percakapan saat ini.');
        }
    }
};