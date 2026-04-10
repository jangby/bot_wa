const axios = require('axios');

module.exports = {
    name: 'jadwalbola',
    description: 'Lihat jadwal pertandingan bola hari ini',
    async execute(client, msg, args) {
        // DAPATKAN API KEY GRATIS DARI RAPIDAPI (API-FOOTBALL)
        const apiKey = '5f107f77dcmsh965b263e2cbffe0p1adc04jsn867fa2171f09';

        if (apiKey === 'MASUKKAN_API_KEY_RAPIDAPI_DISINI') {
            return msg.reply('❌ API Key Jadwal Bola belum diisi oleh Owner bot.');
        }

        await msg.react('⏳');

        try {
            // Mengambil tanggal hari ini format YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            
            const options = {
                method: 'GET',
                url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
                params: { date: today, season: '2023' },
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            };

            const response = await axios.request(options);
            const matches = response.data.response;

            if (!matches || matches.length === 0) {
                return msg.reply('⚽ Tidak ada jadwal pertandingan besar hari ini.');
            }

            // Filter hanya liga besar agar tidak kepanjangan (misal Premier League ID: 39)
            const topLeagues = [39, 140, 135]; // EPL, La Liga, Serie A
            const filteredMatches = matches.filter(m => topLeagues.includes(m.league.id));

            let text = `⚽ *JADWAL BOLA HARI INI* ⚽\n_${today}_\n\n`;

            filteredMatches.forEach(match => {
                const time = new Date(match.fixture.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                text += `🏆 *${match.league.name}*\n`;
                text += `⏰ ${time} WIB\n`;
                text += `⚔️ ${match.teams.home.name} vs ${match.teams.away.name}\n\n`;
            });

            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Jadwal Bola:', error.message);
            await msg.react('❌');
            msg.reply('❌ Gagal mengambil jadwal bola.');
        }
    }
};