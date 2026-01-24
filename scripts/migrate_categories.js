import fs from 'fs';
import path from 'path';

const restaurantsPath = path.join(process.cwd(), 'src', 'data', 'restaurants.js');

// Helper to read file since it's an ES module export
// We'll read it as text and manipulate the array content
let fileContent = fs.readFileSync(restaurantsPath, 'utf-8');

// Extract the array part. Assuming it starts with "export const initialRestaurants = [" and ends with "];"
const startIndex = fileContent.indexOf('[');
const endIndex = fileContent.lastIndexOf(']');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find array in restaurants.js");
    process.exit(1);
}

const arrayString = fileContent.substring(startIndex, endIndex + 1);

// Parse JSON-like string (it's JS object literals, so JSON.parse might fail if keys aren't quoted or trailing commas exist)
// Since it's a JS file, we can't just JSON.parse it easily if it's not strict JSON.
// However, looking at the previous search output, keys are quoted: "id": 25, "categories": [...]
// But we should be careful. 
// A safer way for this environment might be to regex replace the categories in the text content directly if parsing is hard.
// OR, we can try `eval` since we are in a controlled environment, but `import` syntax makes it hard.

// Let's try a different approach: Regex replacement on the file content.
// We look for "categories": [ ... ] blocks and process them.

let newContent = fileContent;

// Regex to find "categories": [ ... ]
// This is tricky with multiline.
// Instead, let's use string replacement for specific category names globally, assuming no collision with other text.
// "健康餐", "老字号", "奶茶" -> remove
// "饮品店", "饮品" -> "饮品"
// "火锅", "烧烤" -> "火锅烧烤"
// "甜品", "甜点" -> "蛋糕甜点"
// "海鲜" -> "煮炒海鲜楼"

// We can iterate over all occurrences of categories arrays.

// Strategy:
// 1. Read file.
// 2. Use a regex to match `"categories":\s*\[(.*?)\]` (dotAll)
// 3. For each match, parse the inner list, transform it, and replace.

newContent = newContent.replace(/"categories":\s*\[(.*?)\]/gs, (match, innerContent) => {
    // innerContent is like: "\n      "饭类"\n    "
    // Split by comma
    let cats = innerContent.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    
    // Transform
    let newCats = new Set();
    cats.forEach(c => {
        if (!c) return;
        if (c === '健康餐' || c === '老字号' || c === '奶茶') return; // Delete
        
        if (c === '饮品店' || c === '饮品') {
            newCats.add('饮品');
        } else if (c === '火锅' || c === '烧烤') {
            newCats.add('火锅烧烤');
        } else if (c === '甜品' || c === '甜点') {
            newCats.add('蛋糕甜点');
        } else if (c === '海鲜') {
            newCats.add('煮炒海鲜楼');
        } else {
            newCats.add(c);
        }
    });

    // Reconstruct string
    const indent = "\n      ";
    const closingIndent = "\n    ";
    if (newCats.size === 0) return `"categories": []`;
    
    const jsonString = Array.from(newCats).map(c => `"${c}"`).join(', ');
    // To maintain formatting roughly, though strictly JSON format is fine too
    return `"categories": [${jsonString}]`;
});

// Also update "category" field (singular) just in case, though app seems to use categories (plural)
newContent = newContent.replace(/"category":\s*\[(.*?)\]/gs, (match, innerContent) => {
    let cats = innerContent.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    let newCats = new Set();
    cats.forEach(c => {
        if (!c) return;
        if (c === '健康餐' || c === '老字号' || c === '奶茶') return;
        
        if (c === '饮品店' || c === '饮品') {
            newCats.add('饮品');
        } else if (c === '火锅' || c === '烧烤') {
            newCats.add('火锅烧烤');
        } else if (c === '甜品' || c === '甜点') {
            newCats.add('蛋糕甜点');
        } else if (c === '海鲜') {
            newCats.add('煮炒海鲜楼');
        } else {
            newCats.add(c);
        }
    });
    const jsonString = Array.from(newCats).map(c => `"${c}"`).join(', ');
    return `"category": [${jsonString}]`;
});

fs.writeFileSync(restaurantsPath, newContent);
console.log("Migration completed.");
