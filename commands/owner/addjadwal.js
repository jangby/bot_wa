const { google } = require('googleapis');
const path = require('path');

// 1. Pengaturan File Kredensial & Email Kalender
const CREDENTIALS_PATH = path.join(__dirname, '../../kredensial.json'); 
const CALENDAR_ID = 'robaya05@gmail.com'; // <--- GANTI DENGAN EMAIL GOOGLE KAMU

// 2. Setup Otentikasi Google
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/calendar.events'], // Izin untuk edit jadwal
});
const calendar = google.calendar({ version: 'v3', auth });

module.exports = {
    name: 'addjadwal',
    description: 'Owner menambahkan jadwal ke Google Calendar',
    async execute(client, msg, args, { isOwner }) {
        
        // Cek apakah yang akses adalah Owner
        if (!isOwner) {
            return msg.reply('❌ Fitur ini khusus untuk Owner!');
        }

        // Gabungkan argumen dan pisahkan berdasarkan simbol "|"
        // Format: !addjadwal 2024-05-20 10:00 | Meeting Klien
        const fullText = args.join(' ');
        const splitText = fullText.split('|');

        if (splitText.length < 2) {
            return msg.reply('⚠️ *Format salah!*\n\nGunakan format:\n*!addjadwal YYYY-MM-DD HH:MM | Nama Acara*\n\nContoh:\n*!addjadwal 2024-05-20 14:30 | Meeting Klien*');
        }

        const dateTimeStr = splitText[0].trim(); // Hasil: "2024-05-20 14:30"
        const summary = splitText[1].trim();     // Hasil: "Meeting Klien"

        try {
            await msg.react('⏳'); // Beri reaksi loading

            // 3. Konversi Waktu ke Format yang Diterima Google (Asumsi WIB GMT+7)
            // Format ISO yang diminta Google: 2024-05-20T14:30:00+07:00
            const isoStartTime = new Date(`${dateTimeStr} GMT+0700`).toISOString();
            
            // Default durasi jadwal kita buat 1 jam dari waktu mulai
            const isoEndTime = new Date(new Date(isoStartTime).getTime() + 60 * 60 * 1000).toISOString();

            const eventData = {
                summary: summary,
                start: {
                    dateTime: isoStartTime,
                    timeZone: 'Asia/Jakarta',
                },
                end: {
                    dateTime: isoEndTime,
                    timeZone: 'Asia/Jakarta',
                },
            };

            // 4. Kirim Data ke Google Calendar
            const response = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                resource: eventData,
            });

            // 5. Balas Jika Sukses
            await msg.reply(`✅ *JADWAL BERHASIL DITAMBAHKAN*\n\n📅 *Acara:* ${summary}\n⏰ *Waktu:* ${dateTimeStr} WIB\n🔗 *Link Google Calendar:*\n${response.data.htmlLink}`);
            await msg.react('🗓️');

        } catch (error) {
            console.error('Google Calendar Error:', error);
            msg.reply('❌ Gagal menambahkan jadwal.\n\nPastikan:\n1. Format tanggal benar (YYYY-MM-DD HH:MM)\n2. Email Google sudah diganti di dalam kode\n3. File kredensial.json sudah benar penempatannya.');
        }
    }
};