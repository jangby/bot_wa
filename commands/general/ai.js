module.exports = {
    name: 'ai', // Nama perintah untuk dipanggil (!ai)
    description: 'Tanya apa saja kepada AI (Llama 3)',
    async execute(client, msg, args, { chat, contact }) {
        // 1. Cek apakah user memasukkan pertanyaan
        if (args.length === 0) {
            return msg.reply('⚠️ Silakan masukkan pertanyaan!\n\n*Contoh:* !ai buatkan resep nasi goreng');
        }

        // Gabungkan array args menjadi satu kalimat utuh
        const pertanyaan = args.join(' ');

        // 2. Beri reaksi atau pesan loading agar user tahu bot sedang berpikir
        // Karena di VPS CPU mungkin butuh beberapa detik
        await msg.react('⏳'); 

        try {
            // 3. Mengirim request ke API Lokal Ollama
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b', // Pastikan nama model sesuai dengan yang kamu unduh (llama3)
                    prompt: pertanyaan,
                    stream: false // Kita set false agar jawaban dikumpulkan utuh dulu, baru dikirim ke WA
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const jawabanAI = data.response;

            // 4. Kirim balasan ke user dan ubah reaksi menjadi centang
            await msg.reply(jawabanAI);
            await msg.react('✅');

        } catch (error) {
            console.error('Error saat menghubungi Ollama:', error);
            await msg.react('❌');
            await msg.reply('Maaf, AI sedang mengalami gangguan atau server Ollama belum menyala.');
        }
    }
};