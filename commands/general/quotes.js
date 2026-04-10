// Pastikan file quotes.js sudah dipindahkan ke folder 'data'
const kumpulanQuotes = require('../../data/quotes'); 

module.exports = {
    name: 'quotes',
    description: 'Kata-kata mutiara acak',
    type: 'general',
    async execute(client, msg, args) {
        const randomQuote = kumpulanQuotes[Math.floor(Math.random() * kumpulanQuotes.length)];
        msg.reply(`💡 *QUOTES HARI INI*\n\n_"${randomQuote}"_`);
    }
};