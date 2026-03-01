module.exports = {
    name: 'cuaca',
    description: 'Cek info cuaca terkini',
    async execute(client, msg, args) {
        const kota = args.join(' ');
        if (!kota) return msg.reply('❌ Masukkan nama kota! Contoh: *!cuaca Bandung*');

        try {
            msg.reply('⏳ Mencari data cuaca...');
            const response = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=j1`);
            const data = await response.json();
            
            const current = data.current_condition[0];
            const text = `🌤️ *CUACA: ${kota.toUpperCase()}*
            
🌡️ Suhu: ${current.temp_C}°C
💧 Kelembapan: ${current.humidity}%
💨 Angin: ${current.windspeedKmph} km/jam
📝 Kondisi: ${current.weatherDesc[0].value}`;

            msg.reply(text);

        } catch (error) {
            msg.reply('❌ Kota tidak ditemukan atau server cuaca sedang sibuk.');
        }
    }
};