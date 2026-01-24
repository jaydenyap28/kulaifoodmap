const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

let jsonContent = fileContent
    .replace('export const initialRestaurants = ', '')
    .replace(/;\s*$/, '');

const restaurants = JSON.parse(jsonContent);

const targets = ['Cafe', '快餐', '酒吧', '中国餐', '杂菜饭'];
const interestingItems = restaurants.filter(r => 
    r.category.some(c => targets.includes(c))
);

interestingItems.forEach(r => {
    console.log(`${r.name} (${r.category.join(', ')})`);
});
