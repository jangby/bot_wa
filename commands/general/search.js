const google = require('googlethis');
const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'search',
    description: 'Pencarian Google lengkap dengan gambar',
    type: 'general', // Bisa diakses di PC maupun Grup
    async execute(client, msg, args) {
        if (args.length === 0) {
            return msg.reply('❌ Masukkan kata kunci pencarian!\nContoh: *!search apa itu internet*');
        }

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari informasi di Google...');

        try {
            // Pengaturan pencarian (Setel ke Bahasa Indonesia)
            const options = {
                page: 0, 
                safe: false, 
                additional_params: { hl: 'id' } // hl = host language (Indonesia)
            };

            // Eksekusi pencarian
            const response = await google.search(query, options);

            // Jika Google tidak menemukan apa-apa
            if (!response.results || response.results.length === 0) {
                await loadingMsg.delete(true).catch(()=>{});
                return msg.reply(`❌ Tidak ditemukan hasil untuk pencarian: *${query}*`);
            }

            // ==========================================
            // 📝 SUSUN TEKS BALASAN
            // ==========================================
            let text = `🌐 *HASIL PENCARIAN GOOGLE* 🌐\n\n`;
            text += `*Topik:* ${query}\n\n`;

            // 1. Cek apakah ada Panel Pengetahuan (Kotak rangkuman dari Google)
            if (response.knowledge_panel && response.knowledge_panel.title) {
                text += `💡 *Ringkasan Google:*\n_${response.knowledge_panel.description}_\n\n`;
            }

            // 2. Ambil 3 Artikel/Website Teratas
            const topResults = response.results.slice(0, 3);
            text += `📰 *Artikel Teratas:*\n`;
            topResults.forEach((res, index) => {
                text += `*${index + 1}. ${res.title}*\n`;
                text += `${res.description}\n`;
                text += `🔗 ${res.url}\n\n`;
            });

            // ==========================================
            // 🖼️ AMBIL GAMBAR PENDUKUNG
            // ==========================================
            let imageMedia = null;
            
            // Cek apakah Google memberikan hasil gambar
            if (response.images && response.images.length > 0) {
                // Ambil URL gambar urutan pertama
                const imageUrl = response.images[0].url;
                
                try {
                    // Gunakan teknik download paksa (seperti di fitur !ai sebelumnya) 
                    // agar tidak gagal karena pemblokiran hotlinking dari website sumber
                    const imgRes = await axios.get(imageUrl, { 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    
                    const base64Image = Buffer.from(imgRes.data, 'binary').toString('base64');
                    imageMedia = new MessageMedia('image/jpeg', base64Image, 'google_image.jpg');
                } catch (imgErr) {
                    console.log('Gambar dari Google gagal diunduh, bot akan mengirim teks saja.');
                }
            }

            // ==========================================
            // 🚀 KIRIM HASIL KE WHATSAPP
            // ==========================================
            if (imageMedia) {
                // Kirim beserta gambar
                await client.sendMessage(msg.from, imageMedia, { caption: text });
            } else {
                // Kalau gambar gagal diambil, kirim teksnya saja
                await msg.reply(text);
            }

            await loadingMsg.delete(true).catch(()=>{});
            await msg.react('✅');

        } catch (error) {
            console.error('Error Google Search:', error.message);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan saat mencoba mengambil data dari Google.').catch(()=>{});
        }
    }
};