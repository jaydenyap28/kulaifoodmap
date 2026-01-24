const fs = require('fs');
const path = require('path');

const restaurantsPath = path.join(__dirname, '../src/data/restaurants.js');
const content = fs.readFileSync(restaurantsPath, 'utf8');

// Extract the array part
const match = content.match(/export const restaurants = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find restaurants array');
    process.exit(1);
}

const restaurants = eval(match[1]);
const counts = {};

restaurants.forEach(r => {
    const cats = Array.isArray(r.category) ? r.category : [r.category];
    cats.forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
    });
});

console.log('Unique Categories:', Object.keys(counts).sort());
console.log('Counts:', counts);
