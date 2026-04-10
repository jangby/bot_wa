const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
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
            // 1. Cari video menggunakan yt-search
            const searchResult = await yts(query);
            const videos = searchResult.videos;

            if (!videos || videos.length === 0) {
                return loadingMsg.reply('❌ Lagu tidak ditemukan di YouTube.');
            }

            const video = videos[0];

            // Batasi durasi maksimal 10 menit (600 detik) agar bot tidak hang dan WA tidak menolak file besar
            if (video.seconds > 600) {
                return msg.reply('❌ Durasi lagu terlalu panjang! Maksimal 10 menit.');
            }

            // Kirim detail lagu terlebih dahulu ke chat
            let textInfo = `🎵 *PLAYING MUSIC* 🎵\n\n`;
            textInfo += `*Judul:* ${video.title}\n`;
            textInfo += `*Channel:* ${video.author.name}\n`;
            textInfo += `*Durasi:* ${video.timestamp}\n\n`;
            textInfo += `_Sedang mengirim file audio..._`;
            await msg.reply(textInfo);

            // 2. Tentukan lokasi penyimpanan sementara di dalam folder bot
            const fileName = `${video.videoId}.mp3`;
            const filePath = path.join(__dirname, '../../', fileName);

            // 3. Proses Download Audio menggunakan @distube/ytdl-core
            const stream = ytdl(video.url, { 
                filter: 'audioonly', 
                quality: 'highestaudio' 
            });

            // Simpan stream audio ke file lokal
            const writeStream = fs.createWriteStream(filePath);
            stream.pipe(writeStream);

            // 4. Jika proses download selesai, kirim ke WA
            writeStream.on('finish', async () => {
                try {
                    const media = MessageMedia.fromFilePath(filePath);
                    
                    // Hapus pesan loading
                    await loadingMsg.delete(true).catch(() => {});
                    
                    // Kirim audio ke obrolan (sendAudioAsVoice: false agar muncul sebagai file musik biasa)
                    await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                    await msg.react('✅');

                } catch (sendErr) {
                    console.error('Gagal mengirim audio:', sendErr);
                    msg.reply('❌ Gagal mengirim file audio ke WhatsApp. File mungkin terlalu besar.');
                } finally {
                    // 5. WAJIB: Hapus file lokal agar harddisk laptop/server Anda tidak penuh
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });

            // Jika terjadi error saat mengunduh dari YouTube
            stream.on('error', (err) => {
                console.error('YTDL Error:', err.message);
                msg.reply('❌ Gagal mengunduh lagu. YouTube mungkin sedang membatasi akses.');
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (error) {
            console.error('Error Play Command:', error.message);
            await msg.react('❌');
            msg.reply('❌ Terjadi kesalahan pada sistem pemutar musik.');
        }
    }
};