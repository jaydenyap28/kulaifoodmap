const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Clean up any potential mess at the end
    // We expect the file to end with the array closing "];"
    // But it might have garbage now.
    
    // Let's find the last occurrence of "];"
    const lastIndex = content.lastIndexOf('];');
    if (lastIndex !== -1) {
        // Truncate everything after "];"
        content = content.substring(0, lastIndex + 2);
    }
    
    // Now append the export correctly
    const exportStatement = "\n\nexport const MAIN_VIDEO_LINK = 'https://www.facebook.com/kulaifoodmap';";
    
    fs.writeFileSync(filePath, content + exportStatement, 'utf8');
    console.log("Successfully fixed and appended export.");
    
} catch (e) {
    console.error("Error:", e);
}
