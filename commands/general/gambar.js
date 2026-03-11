const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'gambar',
    description: 'Membuat gambar dari teks menggunakan AI (Multi-Server)',
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('⚠️ Masukkan deskripsi gambarnya!\n\n*Contoh:* !gambar kucing oren gemuk pakai kacamata hitam di luar angkasa');
        }

        const prompt = args.join(' ');

        await msg.react('⏳');
        const loadingMsg = await msg.reply('Tunggu sebentar ya, AI sedang melukis imajinasimu... 🎨🪄');

        try {
            let base64Data = null;
            let finalPrompt = encodeURIComponent(prompt);

            // ========================================================
            // PERCOBAAN 1: Pollinations (Model Flux - Lebih Stabil)
            // Ditambah random seed agar menghindari error cache dari server
            // ========================================================
            try {
                const randomSeed = Math.floor(Math.random() * 100000);
                const url1 = `https://image.pollinations.ai/prompt/${finalPrompt}?model=flux&seed=${randomSeed}`;
                
                const res1 = await fetch(url1, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                if (res1.ok) {
                    const buffer1 = await res1.arrayBuffer();
                    base64Data = Buffer.from(buffer1).toString('base64');
                    console.log('Gambar sukses via Server 1 (Pollinations Flux)');
                } else {
                    console.log(`Server 1 Gagal: HTTP ${res1.status}`);
                }
            } catch (e) {
                console.log('Error Server 1:', e.message);
            }

            // ========================================================
            // PERCOBAAN 2: Jika Server 1 Down/500, pakai API Siputzx (Flux)
            // ========================================================
            if (!base64Data) {
                try {
                    const url2 = `https://api.siputzx.my.id/api/ai/flux?prompt=${finalPrompt}`;
                    const res2 = await fetch(url2);
                    
                    if (res2.ok) {
                        const buffer2 = await res2.arrayBuffer();
                        base64Data = Buffer.from(buffer2).toString('base64');
                        console.log('Gambar sukses via Server 2 (Siputzx)');
                    }
                } catch (e) {
                    console.log('Error Server 2:', e.message);
                }
            }

            // Jika semua server gagal
            if (!base64Data) {
                throw new Error('Semua server AI pembuat gambar sedang down/sibuk.');
            }

            // ========================================================
            // PROSES PENGIRIMAN GAMBAR
            // ========================================================
            
            // Paksa bot mengenali data tersebut sebagai gambar JPEG
            const media = new MessageMedia('image/jpeg', base64Data, 'gambar-ai.jpg');

            // Kirim gambar ke grup
            await msg.reply(media, null, { caption: `🎨 *Hasil Gambar AI*\n\n📝 *Prompt:* _${prompt}_` });
            
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('✅');

        } catch (error) {
            console.error('Error AI Gambar:', error);
            await loadingMsg.delete(true).catch(() => {});
            await msg.react('❌');
            
            msg.reply(`❌ Gagal membuat gambar.\n*Info:* ${error.message}\nSilakan coba lagi beberapa saat, atau gunakan kata kunci yang lebih simpel.`);
        }
    }
};