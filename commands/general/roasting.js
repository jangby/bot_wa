module.exports = {
    name: 'roasting',
    description: 'Roasting teman tongkrongan pakai AI',
    async execute(client, msg, args, { chat }) {
        // 1. Cek apakah ada orang yang di-tag dalam pesan tersebut
        const mentions = await msg.getMentions();
        
        if (mentions.length === 0) {
            return msg.reply('⚠️ Kamu harus nge-tag target yang mau di-roasting!\n\n*Contoh:* !roasting @Agus sunda');
        }

        // Ambil data orang pertama yang di-tag
        const target = mentions[0];
        // Coba ambil nama asli/pushname-nya, jika tidak ada, gunakan default
        const targetName = target.pushname || target.name || "orang ini";

        // 2. Tentukan bahasa atau tema roasting (dari sisa teks yang diketik)
        // Kita buang kata yang mengandung '@' (yang merupakan tag)
        const argumenTeks = args.filter(kata => !kata.includes('@'));
        
        // Jika ada sisa kata, jadikan itu sebagai instruksi bahasa. Jika tidak, pakai bahasa gaul default.
        const bahasa = argumenTeks.length > 0 
            ? argumenTeks.join(' ') 
            : 'Indonesia gaul ala tongkrongan Jakarta (lo, gue, anjir, bro)';

        // Beri reaksi api biar greget
        await msg.react('🔥');

        try {
            // 3. Susun Instruksi (Prompt) untuk Qwen
            const promptAI = `Kamu adalah teman tongkrongan yang super asik, sarkas, dan jago stand-up comedy. 
Tugasmu sekarang adalah me-roasting seseorang bernama "${targetName}". 
Gunakan bahasa: ${bahasa}. 
Buat roastingannya yang pedas, kocak, nyelekit, tapi tetap terasa seperti candaan tongkrongan. Jangan membawa unsur SARA. Cukup buat dalam 1 paragraf pendek yang pecah banget ketawanya:`;

            // 4. Panggil API lokal Ollama (Menggunakan Qwen 2.5)
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen2.5:1.5b', // Pastikan model ini sudah diunduh di server
                    prompt: promptAI,
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            const hasilRoasting = data.response;

            // 5. Kirim hasil roasting-nya ke grup dan mention targetnya
            await chat.sendMessage(`🎯 *ROASTING TIME!*\n\n${hasilRoasting}`, {
                mentions: [target] // Ini agar tag-nya menyala/berfungsi di WA target
            });
            await msg.react('✅');

        } catch (error) {
            console.error('Error roasting:', error);
            await msg.react('❌');
            await msg.reply('Yah, AI-nya lagi sariawan, gagal me-roasting deh.');
        }
    }
};