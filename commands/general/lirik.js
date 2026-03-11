module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu menggunakan Qwen2.5 Lokal',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagunya!\nContoh: *!lirik Komang*');

        const query = args.join(' ');
        await msg.react('🔍');
        const loadingMsg = await msg.reply(`🔎 Mengambil lirik dari otak Qwen Lokal...`);

        try {
            // Memanggil API Ollama di Localhost VPS kamu
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b',
                    prompt: `Tolong berikan lirik lagu lengkap dari "${query}". 
                             Format jawaban harus rapi: 
                             🎵 *Lirik Lagu Ditemukan* 🎵
                             📌 *Judul:* [Sebutkan Judul]
                             👤 *Penyanyi:* [Sebutkan Artis]
                             ──────────────────
                             [Isi Lirik]
                             
                             Jangan berikan teks penjelasan lain di awal atau akhir.`,
                    stream: false // Kita matikan stream agar hasilnya langsung jadi satu teks
                }),
            });

            const data = await response.json();

            if (!data.response) {
                throw new Error('Qwen tidak memberikan jawaban.');
            }

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(data.response.trim());
            await msg.react('✅');

        } catch (error) {
            console.error('Qwen Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal memanggil Qwen Lokal. Pastikan Ollama sudah berjalan di VPS (`ollama serve`).');
        }
    }
};