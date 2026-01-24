const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Parse
let jsonContent = fileContent
    .replace('export const initialRestaurants = ', '')
    .replace(/;\s*$/, '');
let restaurants = JSON.parse(jsonContent);

// Mappings
const updateCategory = (r) => {
    let cats = r.category || [];
    let newCats = new Set();

    cats.forEach(c => {
        if (c === '快餐') {
            newCats.add('西餐');
        } else if (c === '杂菜饭') {
            newCats.add('饭类');
        } else if (c === '酒吧') {
            newCats.add('西餐');
        } else if (c === '中国餐') {
            if (r.name.includes('面') || r.name.includes('米线')) {
                newCats.add('面类');
            } else {
                newCats.add('煮炒海鲜楼');
            }
        } else if (c === 'Cafe') {
            const name = r.name.toLowerCase();
            const nameEn = (r.name_en || '').toLowerCase();
            if (name.includes('pizza') || nameEn.includes('pizza') ||
                name.includes('burger') || nameEn.includes('burger') ||
                name.includes('steak') || nameEn.includes('steak') ||
                name.includes('grill') || nameEn.includes('grill') ||
                name.includes('western') || nameEn.includes('western') ||
                name.includes('bistro') || nameEn.includes('bistro') ||
                name.includes('ufb') || nameEn.includes('ufb') ||
                name.includes('lemon tree') || nameEn.includes('lemon tree') ||
                name.includes('q house') || nameEn.includes('q house') ||
                name.includes('chicken delights') || nameEn.includes('chicken delights') ||
                name.includes('broovies') || nameEn.includes('broovies') ||
                name.includes('dino') || nameEn.includes('dino') ||
                name.includes('琥珀') || 
                name.includes('vivo') || nameEn.includes('vivo')
            ) {
                newCats.add('西餐');
            } else {
                newCats.add('咖啡店');
            }
        } else {
            newCats.add(c);
        }
    });

    // Update both fields
    const finalCats = Array.from(newCats);
    r.category = finalCats;
    r.categories = finalCats;
};

restaurants.forEach(updateCategory);

// Write back
const newContent = `export const initialRestaurants = ${JSON.stringify(restaurants, null, 2)};`;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated categories.');
