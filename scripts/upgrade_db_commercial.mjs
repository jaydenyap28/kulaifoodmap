
import fs from 'fs';
import { initialRestaurants } from '../src/data/restaurants.js';

console.log(`Processing ${initialRestaurants.length} restaurants...`);

const updated = initialRestaurants.map(r => {
    const level = r.subscriptionLevel !== undefined ? r.subscriptionLevel : 0;
    return {
        ...r,
        subscriptionLevel: level,
        isVIP: level > 0,
        priority: r.priority || 0,
        whatsappLink: r.whatsappLink || ""
    };
});

const fileContent = `export const initialRestaurants = ${JSON.stringify(updated, null, 2)};`;

fs.writeFileSync('src/data/restaurants.js', fileContent);
console.log('Database upgrade complete.');
