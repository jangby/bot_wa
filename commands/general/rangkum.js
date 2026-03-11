module.exports = {
    name: 'rangkum',
    description: 'Merangkum percakapan grup (Versi Cepat & Full Indo)',
    async execute(client, msg, args, { chat }) {
        if (!chat.isGroup) {
            return msg.reply('⚠️ Perintah ini hanya untuk di dalam Grup!');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu bentar ya, AI sedang merangkum... 🕵️‍♂️');

        try {
            // PERBAIKAN 1: Turunkan limit dari 50 ke 25 agar AI memproses lebih cepat
            const limitPesan = 25; 
            const messages = await chat.fetchMessages({ limit: limitPesan });

            let chatHistory = [];
            for (let m of messages) {
                if (!m.body) continue;
                
                let senderName = "Member";
                try {
                    const senderContact = await m.getContact();
                    senderName = senderContact.pushname || senderContact.number || "Member";
                } catch (e) {}

                chatHistory.push(`${senderName}: ${m.body}`);
            }

            if (chatHistory.length < 5) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply('⚠️ Belum cukup banyak obrolan untuk dirangkum.');
            }

            const textPercakapan = chatHistory.join('\n');

            // PERBAIKAN 2: Prompt diubah agar sangat tegas memaksa Bahasa Indonesia
            const promptAI = `TUGAS UTAMA: Kamu WAJIB menjawab HANYA menggunakan Bahasa Indonesia. JANGAN gunakan Bahasa Inggris sama sekali.\n\nBaca log percakapan grup WhatsApp berikut ini:\n\n---\n${textPercakapan}\n---\n\nBuatlah rangkuman singkat 2-3 kalimat tentang apa yang sedang dibahas oleh mereka. Gunakan bahasa Indonesia yang santai:`;

            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3', 
                    prompt: promptAI,
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const data = await response.json();
            const hasilRangkuman = data.response;

            // Hapus pesan loading dan kirim hasilnya
            await loadingMsg.delete(true).catch(()=>{});
            await msg.reply(`*📊 RANGKUMAN CEPAT (${limitPesan} Chat Terakhir)*\n\n${hasilRangkuman}`);
            await msg.react('✅');

        } catch (error) {
            console.error('Error rangkum:', error);
            await msg.react('❌');
            await loadingMsg.delete(true).catch(()=>{});
            await msg.reply('Maaf, AI lagi kewalahan merangkum nih.');
        }
    }
};