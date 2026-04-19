const uang = require('../../utils/uang');
const fs = require('fs');
const path = require('path');

// Path untuk menyimpan data cooldown curi
const cdPath = path.join(__dirname, '../../data/curiCD.json');

module.exports = {
    name: 'curi',
    description: 'Mencuri uang member lain di grup (Risiko ditanggung sendiri!)',
    type: 'game',
    async execute(client, msg, args, { chat, contact }) {
        if (!chat.isGroup) {
            return msg.reply('⚠️ Fitur curi hanya bisa digunakan di dalam grup!');
        }

        const pencuriId = contact.id._serialized;

        // 1. Deteksi Target (bisa pakai tag atau reply)
        let targetId = null;
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            targetId = quotedMsg.author || quotedMsg.from; 
        } else if (msg.mentionedIds && msg.mentionedIds.length > 0) {
            targetId = msg.mentionedIds[0];
        }

        if (!targetId) {
            return msg.reply('❌ Caranya salah!\nFormat: *!curi @orangnya* atau balas pesannya dengan *!curi*');
        }

        if (targetId === pencuriId) {
            return msg.reply('❌ Ngapain kamu mencuri uangmu sendiri? Aneh banget.');
        }

        const botId = client.info.wid._serialized;
        if (targetId === botId) {
            return msg.reply('❌ Kamu mau mencuri dari sistem Bot? Tidak semudah itu Ferguso!');
        }

        // 2. Cek Saldo Target & Pencuri
        const saldoTarget = uang.cekSaldo(targetId);
        const saldoPencuri = uang.cekSaldo(pencuriId);

        if (saldoTarget < 5000) {
            return msg.reply('❌ Kasihan, targetmu lagi kere (saldonya di bawah Rp 5.000). Cari mangsa lain!');
        }

        if (saldoPencuri < 5000) {
            return msg.reply('❌ Kamu harus punya minimal Rp 5.000 sebagai jaminan (untuk bayar denda kalau ketahuan) sebelum bisa mencuri!');
        }

        // 3. Cek Cooldown (Misal: 5 Menit agar tidak spam)
        if (!fs.existsSync(cdPath)) fs.writeFileSync(cdPath, '{}');
        let cooldowns = JSON.parse(fs.readFileSync(cdPath));
        
        const now = Date.now();
        const lastCuri = cooldowns[pencuriId] || 0;
        const cdTime = 5 * 60 * 1000; // 5 Menit

        if (now - lastCuri < cdTime) {
            const sisaWaktu = Math.ceil((cdTime - (now - lastCuri)) / 1000 / 60);
            return msg.reply(`⏳ Kamu sedang dalam incaran polisi! Sembunyi dulu selama *${sisaWaktu} menit* lagi.`);
        }

        cooldowns[pencuriId] = now;
        fs.writeFileSync(cdPath, JSON.stringify(cooldowns, null, 2));

        await msg.reply('🥷 *Mengendap-endap mendekati target...*');
        await new Promise(r => setTimeout(r, 1500)); // Delay efek dramatis

        // 4. LOGIKA GACHA CURI (50% Berhasil, 50% Gagal)
        const chance = Math.random() * 100;

        if (chance < 50) {
            // JIKA BERHASIL (Curi 10% sampai 30% dari saldo target)
            const persenCuri = (Math.floor(Math.random() * 21) + 10) / 100; 
            const dapet = Math.floor(saldoTarget * persenCuri);

            // Eksekusi potong dan tambah saldo
            uang.addSaldo(targetId, -dapet, 'Kecurian');
            uang.addSaldo(pencuriId, dapet, 'Hasil Mencuri');

            return msg.reply(`💸 *BERHASIL!* 💸\n\nKamu sukses menggasak dompet target dan membawa kabur uang sebesar *${uang.formatRupiah(dapet)}*!`);
        } else {
            // JIKA GAGAL KETAHUAN (Didenda 10% sampai 20% dari saldo JIKA ketahuan)
            const persenDenda = (Math.floor(Math.random() * 11) + 10) / 100;
            const denda = Math.floor(saldoPencuri * persenDenda);

            // Uang denda dikasih ke target sebagai kompensasi (atau bisa dihanguskan)
            uang.addSaldo(pencuriId, -denda, 'Denda Ketahuan Mencuri');
            uang.addSaldo(targetId, denda, 'Kompensasi Tangkap Maling');

            return msg.reply(`🚨 *TETOT! KETAHUAN!* 🚨\n\nTarget sadar dan meneriakimu maling! Kamu berhasil ditangkap warga dan harus membayar uang damai ke target sebesar *${uang.formatRupiah(denda)}*.`);
        }
    }
};