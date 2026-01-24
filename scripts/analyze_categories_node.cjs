const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Strip JS wrapper
let jsonContent = fileContent
    .replace('export const initialRestaurants = ', '')
    .replace(/;\s*$/, '');

// Handle trailing commas if any (JSON.parse doesn't like them)
// But wait, the file might be well-formatted JSON array.
// Let's try parsing.

try {
    const restaurants = JSON.parse(jsonContent);
    const allCategories = {};

    restaurants.forEach(r => {
        const cats = r.category || [];
        cats.forEach(c => {
            allCategories[c] = (allCategories[c] || 0) + 1;
        });
    });

    console.log("Categories found:");
    Object.entries(allCategories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            console.log(`${cat}: ${count}`);
        });

} catch (e) {
    console.error("Failed to parse JSON:", e.message);
    // Print a snippet around the failure if possible?
    // Or just dump the first few chars to check format.
    console.log("Start of content:", jsonContent.substring(0, 100));
}
