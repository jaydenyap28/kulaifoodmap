const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We can use regex to replace the image for ID 298 since we know the structure
    // Finding ID 298 block and then its image field is safer.
    
    // Pattern: "id": 298, ... "image": "OLD_URL",
    // But JSON order isn't guaranteed.
    // However, we just wrote it with JSON.stringify so order is consistent.
    
    // Let's verify the current image first
    if (content.includes('"id": 298')) {
         // This is a bit risky with regex if there are duplicates, but we know ID is unique
         // We can find the index of "id": 298, then find the next "image": "..."
         
         const idIndex = content.indexOf('"id": 298');
         const nextImageIndex = content.indexOf('"image":', idIndex);
         
         if (nextImageIndex !== -1) {
             // Find the value
             const valueStart = content.indexOf('"', nextImageIndex + 8) + 1;
             const valueEnd = content.indexOf('"', valueStart);
             const currentImage = content.substring(valueStart, valueEnd);
             
             console.log(`Current image for ID 298: ${currentImage}`);
             
             const newImage = "https://i.ibb.co/3ykJ7Q8J/image.jpg";
             
             // Replace
             content = content.substring(0, valueStart) + newImage + content.substring(valueEnd);
             
             fs.writeFileSync(filePath, content, 'utf8');
             console.log("Updated ID 298 image successfully.");
         } else {
             console.error("Could not find image field for ID 298");
         }
    } else {
        console.error("ID 298 not found in file");
    }
    
} catch (e) {
    console.error("Error:", e);
}
