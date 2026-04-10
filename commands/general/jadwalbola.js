const axios = require('axios');

module.exports = {
    name: 'jadwalbola',
    description: 'Lihat jadwal pertandingan bola hari ini',
    type: 'general', // Agar bisa dipakai di chat pribadi
    async execute(client, msg, args) {
        await msg.react('⏳');

        // 1. Dapatkan tanggal hari ini dan format menjadi YYYYMMDD (Sesuai permintaan API)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}${month}${day}`; // Hasil: misal 20241107

        try {
            // 2. Setting request axios ke API milik Anda
            const options = {
                method: 'GET',
                url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-date',
                params: { date: formattedDate },
                headers: {
                    'x-rapidapi-key': '5f107f77dcmsh965b263e2cbffe0p1adc04jsn867fa2171f09', // API Key Anda
                    'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
                }
            };

            const response = await axios.request(options);
            const data = response.data;

            // 3. Validasi Data
            // Karena kita tidak tahu persis bentuk isi dari API ini, kita ambil object 'response'
            let matches = data.response || data.matches || data; 

            if (!matches || Object.keys(matches).length === 0) {
                return msg.reply('⚽ Tidak ada data pertandingan yang ditemukan untuk hari ini.');
            }

            // 4. Menyusun Teks Pesan
            let text = `⚽ *JADWAL BOLA HARI INI* ⚽\n_${day}/${month}/${year}_\n\n`;

            // Catatan Penting: 
            // Karena setiap API beda cara menyajikan datanya, bagian bawah ini adalah asumsi standar.
            // Jika bot merespons tapi datanya 'undefined', beri tahu saya agar kita perbaiki mapping-nya!
            
            let count = 0;
            // Looping data pertandingan (dibatasi 10 agar pesan WA tidak terlalu panjang)
            for (let i = 0; i < matches.length && count < 10; i++) {
                const match = matches[i];
                
                // Coba ambil nama tim dan waktu (sesuaikan jika struktur JSON API Anda berbeda)
                const homeTeam = match.home || match.homeTeam || match.team1 || "Tim Tuan Rumah";
                const awayTeam = match.away || match.awayTeam || match.team2 || "Tim Tamu";
                const time = match.time || match.status || "Waktu TBA";

                text += `⚔️ *${homeTeam}* vs *${awayTeam}*\n`;
                text += `⏰ Status/Waktu: ${time}\n\n`;
                count++;
            }

            text += `\n_Menampilkan ${count} pertandingan._`;

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Jadwal Bola:', error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal mengambil jadwal bola. Server API mungkin sedang sibuk atau limit harian habis.');
        }
    }
};