const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of "无招牌/路边摊" with "路边摊/餐车"
const oldCategory = "无招牌/路边摊";
const newCategory = "路边摊/餐车";

// We use a global replace. Since it's a JSON-like JS file, the category string appears in quotes.
// e.g. "category": ["无招牌/路边摊"] or "categories": ["无招牌/路边摊"]
// A simple string replace is safe enough here because the string is unique and specific.

const count = (content.match(new RegExp(oldCategory, 'g')) || []).length;

if (count > 0) {
    content = content.replaceAll(oldCategory, newCategory);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully replaced ${count} occurrences of "${oldCategory}" with "${newCategory}".`);
} else {
    console.log(`No occurrences of "${oldCategory}" found.`);
}
