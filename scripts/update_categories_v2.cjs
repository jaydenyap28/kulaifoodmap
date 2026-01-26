const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
console.log(`Reading file: ${filePath}`);
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const newLines = [];

let insideCategory = false;
let changesCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for start of category/categories array
    // Matches "category": [ or "categories": [
    if (trimmedLine.startsWith('"category": [') || trimmedLine.startsWith('"categories": [')) {
        insideCategory = true;
        newLines.push(line);
        // Check if it's a single line array like "category": [],
        if (trimmedLine.endsWith('],') || trimmedLine.endsWith(']')) {
             insideCategory = false;
        }
        continue;
    }
    
    // Check for end of array
    if (insideCategory && (trimmedLine.startsWith(']') || trimmedLine.startsWith('],'))) {
        insideCategory = false;
        newLines.push(line);
        continue;
    }
    
    if (insideCategory) {
        // We are inside category array
        
        // Remove "Pizza"
        if (line.includes('"Pizza"')) {
            console.log(`Removing "Pizza" at line ${i+1}`);
            changesCount++;
            continue; // Delete
        }
        
        // Remove "炸鸡"
        if (line.includes('"炸鸡"')) {
            console.log(`Removing "炸鸡" at line ${i+1}`);
            changesCount++;
            continue; // Delete
        }
        
        // Rename "无招牌美食" -> "无招牌/路边摊"
        if (line.includes('"无招牌美食"')) {
            console.log(`Renaming "无招牌美食" at line ${i+1}`);
            newLines.push(line.replace('无招牌美食', '无招牌/路边摊'));
            changesCount++;
            continue;
        }
        
        // Rename "中餐" -> "煮炒海鲜楼"
        if (line.includes('"中餐"')) {
            console.log(`Renaming "中餐" at line ${i+1}`);
            newLines.push(line.replace('中餐', '煮炒海鲜楼'));
            changesCount++;
            continue;
        }
        
        newLines.push(line);
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log(`Done. Made ${changesCount} changes.`);
