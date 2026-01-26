const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');
const backupPath = path.join(__dirname, '../src/data/restaurants.backup.js');

const unwanted = ["Pizza", "炸鸡", "中餐", "中国餐"];

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    fs.writeFileSync(backupPath, content);
    console.log('Backup created at:', backupPath);

    // Extract JSON part
    const startMarker = 'export const initialRestaurants = ';
    const endMarker = ';'; // Assuming the file ends with a semicolon or we can just parse until the end
    
    // Simple regex to extract the array
    // Matches everything from [ to the last ]
    const match = content.match(/export const initialRestaurants = (\[[\s\S]*\]);?/);
    
    if (!match) {
        throw new Error('Could not find initialRestaurants array');
    }

    let jsonStr = match[1];
    // Fix any trailing commas if present (JSON.parse might fail) - simple regex for standard JSON
    // But since it's a JS file, it might have trailing commas.
    // We can use `eval` or `new Function` to parse it since it's trusted local code, 
    // but `JSON.parse` is safer if it's strict JSON.
    // Given it's a JS file, let's use `eval` carefully or just try to clean it.
    // Actually, creating a temporary CJS file to require it might be easier.
    
    // Let's use a safer approach: standard string manipulation for replacement if we can,
    // OR just use eval since we are in a dev environment tool.
    
    let restaurants;
    try {
        // Use Function constructor to parse JS object/array syntax
        restaurants = new Function('return ' + jsonStr)();
    } catch (e) {
        console.error('Failed to parse via Function constructor:', e);
        process.exit(1);
    }

    let modifiedCount = 0;

    const updatedRestaurants = restaurants.map(r => {
        let modified = false;
        
        // Filter categories
        if (r.category) {
            const originalLen = r.category.length;
            r.category = r.category.filter(c => !unwanted.includes(c));
            if (r.category.length !== originalLen) modified = true;
        }
        
        if (r.categories) {
            const originalLen = r.categories.length;
            r.categories = r.categories.filter(c => !unwanted.includes(c));
            if (r.categories.length !== originalLen) modified = true;
        }

        // Also filter tags if desired, but user focused on Categories.
        // Let's filter tags too to be safe/clean.
        if (r.tags) {
            const originalLen = r.tags.length;
            r.tags = r.tags.filter(c => !unwanted.includes(c));
            if (r.tags.length !== originalLen) modified = true;
        }

        if (modified) modifiedCount++;
        return r;
    });

    console.log(`Modified ${modifiedCount} restaurants.`);

    // Convert back to string
    const newJsonStr = JSON.stringify(updatedRestaurants, null, 2);
    const newContent = `${startMarker}${newJsonStr};`;

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully updated restaurants.js');

} catch (error) {
    console.error('Error:', error);
}
