module.exports = {
    name: 'sholat',
    description: 'Cek jadwal sholat',
    type: 'general',
    async execute(client, msg, args) {
        const kota = args.join(' ');
        if (!kota) return msg.reply('❌ Masukkan nama kota! Contoh: *!sholat Jakarta*');

        try {
            const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=11`);
            const json = await response.json();

            if (json.code !== 200) throw new Error('Kota tidak ditemukan');

            const jadwal = json.data.timings;
            const date = json.data.date.readable;

            const text = `🕌 *JADWAL SHOLAT ${kota.toUpperCase()}*
📅 ${date}

Subuh: ${jadwal.Fajr}
Dzuhur: ${jadwal.Dhuhr}
Ashar: ${jadwal.Asr}
Maghrib: ${jadwal.Maghrib}
Isya: ${jadwal.Isha}`;

            msg.reply(text);

        } catch (error) {
            msg.reply('❌ Kota tidak ditemukan.');
        }
    }
};