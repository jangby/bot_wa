const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
    name: 'server',
    description: 'Cek status dan resource server (Khusus Owner)',
    type: 'owner', // Pastikan di index.js Anda tipe 'owner' dibatasi hanya untuk Anda
    async execute(client, msg, args) {
        await msg.react('⏳');

        try {
            // 1. INFO RAM
            const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedRam = (totalRam - freeRam).toFixed(2);
            const ramPercent = Math.round((usedRam / totalRam) * 100);

            // 2. INFO CPU & LOAD AVERAGE (Beban Server)
            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const coreCount = cpus.length;
            const loadAvg = os.loadavg().map(load => load.toFixed(2)).join(', '); // Load 1m, 5m, 15m

            // 3. INFO UPTIME (Sudah berapa lama server hidup)
            const uptimeSeconds = os.uptime();
            const days = Math.floor(uptimeSeconds / (3600 * 24));
            const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);

            // 4. INFO HARDDISK (Menjalankan perintah terminal Ubuntu secara diam-diam)
            let diskInfo = 'Gagal membaca disk';
            try {
                // Perintah df -h untuk membaca partisi utama (root) di Linux
                const { stdout } = await execPromise("df -h / | awk 'NR==2 {print $3 \" terpakai dari \" $2 \" (\" $5 \")\"}'");
                diskInfo = stdout.trim();
            } catch (diskErr) {
                console.error('Error baca disk:', diskErr);
            }

            // ==========================================
            // 📝 SUSUN TEKS LAPORAN
            // ==========================================
            let text = `🖥️ *LAPORAN MONITORING SERVER* 🖥️\n\n`;
            
            text += `⚙️ *SYSTEM INFO*\n`;
            text += `*OS:* ${os.type()} ${os.release()}\n`;
            text += `*Uptime:* ${days} Hari, ${hours} Jam, ${minutes} Menit\n\n`;

            text += `🧠 *CPU & PROCESSOR*\n`;
            text += `*Model:* ${cpuModel}\n`;
            text += `*Cores:* ${coreCount} Core\n`;
            text += `*Load Avg (1m, 5m, 15m):* ${loadAvg}\n\n`;

            text += `💾 *MEMORY (RAM)*\n`;
            text += `*Kapasitas:* ${totalRam} GB\n`;
            text += `*Terpakai:* ${usedRam} GB (${ramPercent}%)\n`;
            text += `*Tersisa:* ${freeRam} GB\n\n`;

            text += `💽 *PENYIMPANAN (DISK /)*\n`;
            text += `*Status:* ${diskInfo}\n`;

            // Kirim pesan
            await msg.reply(text);
            await msg.react('✅');

        } catch (error) {
            console.error('Error Monitoring Server:', error);
            await msg.react('❌');
            msg.reply('❌ Gagal mengambil data dari server.');
        }
    }
};