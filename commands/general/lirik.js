module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu menggunakan Qwen2.5 Lokal',
    type: 'general',
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
    prompt: `[INST] Kamu adalah DATABASE LIRIK LAGU. Tugasmu hanya satu: menuliskan lirik lagu.
             Dilarang berkomentar, dilarang meminta maaf, dan dilarang mengaku tidak tahu.
             
             Tuliskan lirik lagu: "${query}"
             
             Format:
             🎵 *Lirik Lagu Ditemukan* 🎵
             📌 *Judul:* [Judul]
             👤 *Penyanyi:* [Artis]
             ──────────────────
             [LIRIK LENGKAP] [/INST]`,
    stream: false,
    options: {
        num_predict: 800,
        temperature: 0.1, // Turunkan suhu agar AI lebih fokus pada data, bukan ngobrol
        top_p: 0.9
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