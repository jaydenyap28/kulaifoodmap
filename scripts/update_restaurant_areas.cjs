const fs = require('fs');
const path = require('path');

// 1. User Provided Updates
const userUpdates = [ 
   { "id": "1", "area": "Kulai 21 Miles" }, 
   { "id": "3", "area": "Indahpura" }, 
   { "id": "4", "area": "Kulai 21 Miles" }, 
   { "id": "5", "area": "Indahpura" }, 
   { "id": "7", "area": "Saleng" }, 
   { "id": "8", "area": "Kulai 21 Miles" }, 
   { "id": "9", "area": "Indahpura" }, 
   { "id": "10", "area": "Kulai 21 Miles" }, 
   { "id": "13", "area": "Kulai 21 Miles" }, 
   { "id": "14", "area": "Kelapa Sawit" }, 
   { "id": "15", "area": "Indahpura" }, 
   { "id": "17", "area": "Kulai 21 Miles" }, 
   { "id": "18", "area": "Kulai 21 Miles" }, 
   { "id": "19", "area": "Kulai 21 Miles" }, 
   { "id": "20", "area": "Kulai 21 Miles" }, 
   { "id": "21", "area": "Kulai 21 Miles" }, 
   { "id": "22", "area": "Kulai 21 Miles" }, 
   { "id": "23", "area": "Kulai 21 Miles" }, 
   { "id": "24", "area": "Kulai 21 Miles" }, 
   { "id": "25", "area": "Kulai 21 Miles" }, 
   { "id": "26", "area": "Kulai 21 Miles" }, 
   { "id": "27", "area": "Kulai 21 Miles" }, 
   { "id": "28", "area": "Kulai 21 Miles" }, 
   { "id": "46", "area": "Indahpura" }, 
   { "id": "47", "area": "Indahpura" }, 
   { "id": "48", "area": "Indahpura" }, 
   { "id": "49", "area": "Indahpura" }, 
   { "id": "50", "area": "Indahpura" }, 
   { "id": "51", "area": "Indahpura" }, 
   { "id": "52", "area": "Indahpura" }, 
   { "id": "53", "area": "Indahpura" }, 
   { "id": "54", "area": "Indahpura" }, 
   { "id": "55", "area": "Indahpura" }, 
   { "id": "56", "area": "Indahpura" }, 
   { "id": "57", "area": "Indahpura" }, 
   { "id": "58", "area": "Indahpura" }, 
   { "id": "59", "area": "Indahpura" }, 
   { "id": "60", "area": "Indahpura" }, 
   { "id": "61", "area": "" } 
];

// Create a map for fast lookup (Convert IDs to numbers to match source)
const updateMap = new Map(userUpdates.map(u => [Number(u.id), u.area]));

// Path to restaurants.js
const restaurantsPath = path.join(__dirname, '../src/data/restaurants.js');

// Read file
let content = fs.readFileSync(restaurantsPath, 'utf8');

// Extract the array part (assuming export const initialRestaurants = [...];)
// We will use a regex to find objects and update them safely
// But since the file is a JS module, we can also try to parse it more robustly or just regex replace.
// Given the structure is consistent, we can iterate line by line or use regex replacement for each ID.

console.log(`Processing ${userUpdates.length} manual updates...`);

// Strategy: Parse the file content to find objects and inject/update 'area' field.
// Since we can't easily eval the file, we'll do string manipulation.

// 1. Apply Manual Updates
userUpdates.forEach(update => {
    const id = Number(update.id);
    const newArea = update.area;
    
    // Regex to find the object with this ID
    // Look for "id": 1, or id: 1, followed by other fields until closing brace
    // We will inject "area": "Value", right after "id": X,
    
    // First, check if area already exists for this ID
    const idPattern = new RegExp(`("id":\\s*${id},[\\s\\S]*?)("area":\\s*"[^"]*",?)`, 'g');
    
    if (idPattern.test(content)) {
        // Update existing area
        content = content.replace(idPattern, `$1"area": "${newArea}",`);
    } else {
        // Add new area field
        // Find "id": X, and append area after it
        const insertPattern = new RegExp(`("id":\\s*${id},)`, 'g');
        content = content.replace(insertPattern, `$1\n    "area": "${newArea}",`);
    }
});

// 2. Apply Auto-detection for Indahpura and Bandar Putra
console.log("Applying auto-detection for Indahpura and Bandar Putra...");

// We need to match objects that DON'T have an area set yet (or we can overwrite if not in manual list)
// Regex to iterate all objects is hard. 
// Alternative: Split by objects and process.

// Let's do a global replace with a callback function for more control
// Match entire object structure is risky.
// Let's use specific keyword replacement.

// Find all addresses containing 'Indahpura'
// We will search for blocks: "address": "...Indahpura...", ... "id": X
// This is tricky with regex order.

// Simpler approach: 
// 1. Read file into memory.
// 2. Split by "{" to get rough object chunks (fragile but workable for this specific file structure).
// Better: Use the fact that "address" line usually comes after "id" or close to it.

// Let's do a pass to find IDs associated with Indahpura/Bandar Putra addresses
// We iterate through the file line by line to build a map of ID -> Address
const lines = content.split('\n');
let currentId = null;
let autoUpdates = 0;

const newLines = lines.map((line, index) => {
    // Check for ID
    const idMatch = line.match(/"id":\s*(\d+),/);
    if (idMatch) {
        currentId = Number(idMatch[1]);
        return line;
    }

    // Check for Address
    if (currentId !== null) {
        const addressMatch = line.match(/"address":\s*"(.*)",/);
        if (addressMatch) {
            const address = addressMatch[1];
            
            // Check if this ID is in manual updates (Skip if yes - User priority)
            if (updateMap.has(currentId)) {
                return line;
            }

            // Check if line already has area (Skip to avoid duplicates if already present, though our regex above handles update)
            // But we need to insert 'area' field if missing.
            
            let area = null;
            if (address.toLowerCase().includes('indahpura')) {
                area = 'Indahpura';
            } else if (address.toLowerCase().includes('bandar putra') || address.toLowerCase().includes('putra')) {
                area = 'Bandar Putra';
            }

            if (area) {
                // We need to inject the area field.
                // Since we are mapping lines, we can't easily insert a new line here unless we modify the previous line or this one.
                // Actually, we can append it to the ID line, but we passed it.
                // We can append it to this address line? No, JSON format.
                
                // Let's just store this auto-update and apply it using the same regex method as manual updates later.
                if (!updateMap.has(currentId)) {
                     updateMap.set(currentId, area); // Add to map for processing
                     autoUpdates++;
                }
            }
        }
    }
    return line;
});

// Now apply ALL updates from the map (Manual + Auto)
// Re-read content to be safe (or use modified content from step 1? No, step 1 was partial)
// Let's re-run the replacement logic on the original content for everything in updateMap.

// Reset content to original read (with manual updates applied? No, let's start fresh-ish)
// Actually, step 1 modified 'content'.
// We should run the auto-detection on the *already modified* content to avoid overwriting manual fixes?
// Yes. But my auto-detection logic above was "Skip if in manual updates".
// So I just need to apply the NEW auto-detected ones to 'content'.

console.log(`Found ${autoUpdates} additional auto-detected areas.`);

updateMap.forEach((area, id) => {
    // Only apply if NOT already applied in step 1 (Manual)
    // Actually, running the replace again is harmless as it updates or inserts.
    // But to be efficient, we can just run for all.
    
    const idPattern = new RegExp(`("id":\\s*${id},[\\s\\S]*?)("area":\\s*"[^"]*",?)`, 'g');
    
    if (idPattern.test(content)) {
        // Update existing area
        content = content.replace(idPattern, `$1"area": "${area}",`);
    } else {
        // Add new area field
        const insertPattern = new RegExp(`("id":\\s*${id},)`, 'g');
        content = content.replace(insertPattern, `$1\n    "area": "${area}",`);
    }
});

// Write back
fs.writeFileSync(restaurantsPath, content, 'utf8');
console.log("Successfully updated restaurants.js");
