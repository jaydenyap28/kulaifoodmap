
import { initialRestaurants } from '../src/data/restaurants.js';

console.log('Loading restaurants data...');
console.log(`Total count: ${initialRestaurants.length}`);

const ids = new Set();
const duplicates = [];

initialRestaurants.forEach(r => {
    if (ids.has(r.id)) {
        duplicates.push(r.id);
    }
    ids.add(r.id);
});

if (duplicates.length > 0) {
    console.error('Duplicate IDs found:', duplicates);
    process.exit(1);
} else {
    console.log('No duplicate IDs found.');
}

const lastId = initialRestaurants[initialRestaurants.length - 1].id;
console.log(`Last ID: ${lastId}`);

if (lastId !== 307) {
    console.error(`Expected last ID to be 307, but got ${lastId}`);
} else {
    console.log('Last ID matches expected (307).');
}

// Check specifically for "Thai Lala"
const thaiLala = initialRestaurants.find(r => r.name === "泰啦啦" || r.name_en === "THAI LALA");
if (thaiLala) {
    console.log('Found Thai Lala:', thaiLala);
} else {
    console.error('Thai Lala NOT found!');
}
