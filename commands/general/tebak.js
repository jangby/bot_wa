const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: 'tebak',
    description: 'Menebak umur, gender, ras, dan emosi dari foto wajah',
    type: 'general',
    async execute(client, msg, args) {
        
        // 1. Cek apakah user mengirim gambar atau me-reply gambar
        let mediaMessage = msg;
        if (msg.hasQuotedMsg) {
            mediaMessage = await msg.getQuotedMessage();
        }

        // Validasi format file
        if (!mediaMessage.hasMedia || mediaMessage.type !== 'image') {
            return msg.reply('❌ Kirim foto wajah dengan caption *!tebak* atau reply foto yang sudah ada dengan *!tebak*.');
        }

        await msg.react('⏳');
        const loadingMsg = await msg.reply('🔍 AI sedang menganalisis wajah pada gambar, tunggu sebentar...');

        try {
            // 2. Download gambar dari WhatsApp
            const media = await mediaMessage.downloadMedia();
            
            if (!media || !media.data) {
                 await loadingMsg.delete(true).catch(()=>{});
                 return msg.reply('❌ Gagal mengunduh gambar dari obrolan.');
            }

            // 3. Simpan gambar sementara di dalam folder data
            const tempFilename = path.join(__dirname, `../../data/temp_tebak_${Date.now()}.jpg`);
            fs.writeFileSync(tempFilename, media.data, 'base64');

            // 4. Panggil script Python melalui sistem Ubuntu
            const pythonScriptPath = path.join(__dirname, '../../utils/tebak_wajah.py');
            
            // Arahkan ke file python di dalam folder venv milik bot
            // Asumsinya folder 'venv' ada di root direktori bot Anda
            const pythonExecutable = path.join(__dirname, '../../venv/bin/python');

            // Mengeksekusi Python dari Venv di latar belakang Ubuntu
            exec(`"${pythonExecutable}" "${pythonScriptPath}" "${tempFilename}"`, async (error, stdout, stderr) => {
                
                // Hapus gambar sementara segera setelah proses Python selesai (Mencegah storage VPS penuh)
                if (fs.existsSync(tempFilename)) {
                    fs.unlinkSync(tempFilename);
                }

                if (error) {
                    console.error('Error saat menjalankan Python:', error);
                    await msg.react('❌');
                    return loadingMsg.edit('❌ Terjadi kesalahan mesin saat menjalankan AI.').catch(()=>{});
                }

                try {
                    // 5. Tangkap data JSON dari Python dan susun pesan WhatsApp
                    const result = JSON.parse(stdout.trim());

                    if (result.status === 'error') {
                        await msg.react('❌');
                        return loadingMsg.edit(`❌ AI gagal menganalisis wajah. Pastikan foto terlihat jelas.\nDetail: ${result.message}`).catch(()=>{});
                    }

                    // Format balasan untuk grup WA
                    let replyText = `👤 *HASIL ANALISIS WAJAH (AI)* 👤\n\n`;
                    replyText += `Umur   : ${result.umur} tahun\n`;
                    replyText += `Gender : ${result.gender}\n`;
                    replyText += `Ras    : ${result.ras}\n`;
                    replyText += `Emosi  : ${result.emosi}\n`;

                    await msg.reply(replyText);
                    
                    await loadingMsg.delete(true).catch(()=>{});
                    await msg.react('✅');

                } catch (parseError) {
                    console.error('Gagal membaca JSON dari Python:', parseError);
                    await msg.react('❌');
                    await loadingMsg.edit('❌ Gagal menerjemahkan data dari AI.').catch(()=>{});
                }
            });

        } catch (error) {
            console.error('Error keseluruhan:', error);
            await msg.react('❌');
            await loadingMsg.edit('❌ Terjadi kesalahan sistem.').catch(()=>{});
        }
    }
};