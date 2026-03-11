module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu menggunakan Qwen2.5 Lokal',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagunya!');

        const query = args.join(' ');
        await msg.react('🔍');
        const loadingMsg = await msg.reply(`🔎 Qwen sedang menuliskan lirik untukmu...`);

        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b',
                    prompt: `Kamu adalah asisten musik yang handal. 
                             Tuliskan lirik LENGKAP lagu "${query}". 
                             
                             WAJIB menggunakan format ini:
                             🎵 *Lirik Lagu Ditemukan* 🎵
                             📌 *Judul:* [Judul Lagu]
                             👤 *Penyanyi:* [Nama Penyanyi]
                             ──────────────────
                             [TULIS SELURUH LIRIK DI SINI DARI AWAL SAMPAI HABIS]
                             
                             Jangan berhenti sebelum lirik selesai.`,
                    stream: false,
                    options: {
                        num_predict: 1000, // Memaksa AI menulis lebih panjang (biar gak kepotong)
                        temperature: 0.7   // Biar lebih kreatif tapi tetep akurat
                    }
                }),
            });

            const data = await response.json();
            const result = data.response.trim();

            if (!result || result.length < 50) {
                throw new Error('Hasil terlalu pendek, sepertinya Qwen lagi malas.');
            }

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(result);
            await msg.react('✅');

        } catch (error) {
            console.error('Qwen Lirik Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            msg.reply('❌ Qwen gagal memberikan lirik lengkap. Coba sekali lagi atau gunakan judul + artis yang jelas.');
        }
    }
};