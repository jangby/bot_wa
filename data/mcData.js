module.exports = {
    // DAFTAR HERO
    heroes: [
        // --- TANKS (Darah Tebal, Damage Kecil) ---
        { id: 'tigreal', name: 'Tigreal', role: 'Tank', price: 1, hp: 200, atk: 15, emoji: '🛡️' },
        { id: 'hylos', name: 'Hylos', role: 'Tank', price: 2, hp: 300, atk: 20, emoji: '🐴' },
        { id: 'franco', name: 'Franco', role: 'Tank', price: 3, hp: 400, atk: 25, emoji: '⛓️' },

        // --- ARCHER (Darah Tipis, Damage Besar) ---
        { id: 'layla', name: 'Layla', role: 'Archer', price: 1, hp: 100, atk: 40, emoji: '🔫' },
        { id: 'miya', name: 'Miya', role: 'Archer', price: 2, hp: 120, atk: 55, emoji: '🏹' },
        { id: 'moskov', name: 'Moskov', role: 'Archer', price: 3, hp: 150, atk: 70, emoji: '🔱' },

        // --- MAGE (Darah Tipis, Skill Area/Burst) ---
        { id: 'eudora', name: 'Eudora', role: 'Mage', price: 1, hp: 90, atk: 50, emoji: '⚡' },
        { id: 'aurora', name: 'Aurora', role: 'Mage', price: 2, hp: 110, atk: 65, emoji: '❄️' },
        { id: 'valir', name: 'Valir', role: 'Mage', price: 3, hp: 130, atk: 80, emoji: '🔥' }
    ],

    // LOGIKA SINERGI (Bonus Stat)
    synergies: {
        'Tank': { req: 2, buff: 'hp', value: 100, desc: '+100 HP untuk semua Tank' },
        'Archer': { req: 2, buff: 'atk', value: 20, desc: '+20 ATK untuk semua Archer' },
        'Mage': { req: 2, buff: 'atk', value: 30, desc: '+30 Magic Power' }
    }
};