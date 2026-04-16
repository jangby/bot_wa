module.exports = {
    name: 'perkata',
    description: 'Menampilkan ayat dengan terjemahan per kata (Multi bahasa: id/en)',
    type: 'general',
    async execute(client, msg, args) {
        if (args.length < 2) return msg.reply('❌ Format: *!perkata [no_surah] [no_ayat] [id/en]*\nContoh: *!perkata 2 255 id*');

        const surah = args[0];
        const ayat = args[1];
        let lang = 'id'; // Default bahasa Indonesia
        
        // Cek jika argumen ketiga adalah bahasa
        if (args[2] && (args[2].toLowerCase() === 'id' || args[2].toLowerCase() === 'en')) {
            lang = args[2].toLowerCase();
        }

        try {
            msg.reply('⏳ Memproses terjemahan per kata...');
            
            // Endpoint Quran.com v4 dengan parameter words=true
            const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${surah}:${ayat}?words=true&word_translation_language=${lang}`);
            const json = await response.json();

            if (!json.verse) return msg.reply('❌ Ayat tidak ditemukan. Pastikan nomor surah dan ayat benar.');

            let text = `📖 *Q.S. ${surah} : ${ayat}*\n*(Terjemahan Per Kata - ${lang.toUpperCase()})*\n\n`;
            
            // Melakukan looping untuk setiap kata di dalam ayat
            json.verse.words.forEach(word => {
                // Abaikan tanda end-mark (nomor ayat di akhir)
                if (word.char_type_name !== 'end') { 
                    const arabic = word.text_uthmani;
                    const translation = word.translation ? word.translation.text : '-';
                    
                    text += `${arabic}\n_${translation}_\n\n`;
                }
            });

            msg.reply(text.trim());

        } catch (error) {
            console.error(error);
            msg.reply('❌ Terjadi kesalahan saat mengambil data.');
        }
    }
};