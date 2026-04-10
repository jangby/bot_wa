const play = require('play-dl');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'play',
    description: 'Cari dan unduh lagu dari YouTube',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        if (args.length === 0) return msg.reply('❌ Masukkan judul lagu! Contoh: *!play sempurna andra*');

        const query = args.join(' ');
        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 Sedang mencari dan mengunduh lagu, harap tunggu sebentar...');

        try {
            // 1. Mencari video langsung menggunakan play-dl (Limit 1 hasil teratas)
            const searchResults = await play.search(query, { limit: 1 });

            if (!searchResults || searchResults.length === 0) {
                return loadingMsg.reply('❌ Lagu tidak ditemukan di YouTube.');
            }

            const video = searchResults[0];

            // Batasi durasi maksimal (misal 10 menit = 600 detik) agar bot tidak hang
            if (video.durationInSec > 600) {
                return loadingMsg.reply('❌ Durasi lagu terlalu panjang! Maksimal 10 menit.');
            }

            // Kirim pesan info lagu
            let textInfo = `🎵 *PLAYING MUSIC* 🎵\n\n`;
            textInfo += `*Judul:* ${video.title}\n`;
            textInfo += `*Channel:* ${video.channel.name}\n`;
            textInfo += `*Durasi:* ${video.durationRaw}\n\n`;
            textInfo += `_Sedang memproses audio, mohon tunggu..._`;
            await loadingMsg.edit(textInfo).catch(() => msg.reply(textInfo)); // Fallback jika .edit() gagal

            // 2. Siapkan file untuk menyimpan sementara
            // Kita hapus karakter aneh dari judul agar nama file aman
            const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${safeTitle}.mp3`;
            const filePath = path.join(__dirname, '../../', fileName);

            // 3. Ambil stream audio dari YouTube
            const stream = await play.stream(video.url);

            // Tulis stream tersebut ke dalam file lokal
            const writeStream = fs.createWriteStream(filePath);
            stream.stream.pipe(writeStream);

            // 4. Setelah selesai diunduh, kirim file ke WhatsApp
            writeStream.on('finish', async () => {
                try {
                    const media = MessageMedia.fromFilePath(filePath);
                    
                    // Kirim audio
                    await client.sendMessage(msg.from, media, { 
                        sendAudioAsVoice: false // false = jadi lagu/mp3 biasa. Ubah ke true jika ingin jadi Voice Note
                    });
                    
                    await msg.react('✅');

                } catch (sendErr) {
                    console.error('Gagal mengirim audio:', sendErr);
                    msg.reply('❌ Gagal mengirim file audio ke WhatsApp. File mungkin terlalu besar.');
                } finally {
                    // 5. WAJIB: Hapus file lokal agar harddisk tidak kepenuhan
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });

            writeStream.on('error', (err) => {
                console.error('File Stream Error:', err);
                msg.reply('❌ Terjadi kesalahan saat memproses file lagu.');
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (error) {
            console.error('Error Play Command:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan atau YouTube menolak koneksi bot. Coba judul lagu lain.');
        }
    }
};