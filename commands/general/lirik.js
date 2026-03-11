module.exports = {
    name: 'lirik',
    description: 'Mencari lirik lagu menggunakan AI (Anti-Limit)',
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('⚠️ Masukkan judul lagunya!\nContoh: *!lirik Komang*');

        const query = args.join(' ');
        await msg.react('🔍');
        const loadingMsg = await msg.reply(`🔎 AI sedang mengingat lirik *"${query}"*...`);

        try {
            // Kita gunakan API Gemini untuk mencari lirik
            // Ini jauh lebih stabil karena database AI sangat besar
            const aiRes = await fetch(`https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(
                `Tolong berikan lirik lagu lengkap dari "${query}". 
                Format jawaban harus rapi: 
                🎵 *Lirik Lagu ditemukan* 🎵
                📌 *Judul:* [Judul]
                👤 *Penyanyi:* [Artis]
                ──────────────────
                [Isi Lirik]
                
                Jangan berikan teks penjelasan lain, langsung format tersebut.`
            )}`);
            
            const aiData = await aiRes.json();

            if (!aiData.status || !aiData.data) {
                throw new Error('AI tidak bisa menemukan lirik tersebut.');
            }

            await loadingMsg.delete(true).catch(() => {});
            await msg.reply(aiData.data);
            await msg.react('✅');

        } catch (error) {
            console.error('Lirik AI Error:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            msg.reply('❌ Gagal mencari lirik bahkan dengan AI.\n\n_Saran: Pastikan koneksi bot ke internet lancar._');
        }
    }
};