const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');

async function run() {
    console.log("Reading file...");
    let content = fs.readFileSync(filePath, 'utf8');

    // extract the array
    const match = content.match(/export const initialRestaurants = (\[[\s\S]*?\]);/);
    if (!match) {
        console.error("Could not find initialRestaurants array");
        return;
    }

    let arrayStr = match[1];
    let restaurants;
    try {
        restaurants = new Function('return ' + arrayStr)();
        console.log(`Parsed ${restaurants.length} restaurants.`);
    } catch (e) {
        console.error("Failed to parse restaurants array:", e);
        return;
    }

    // Fix ID 298 (Bask Bear Coffee) image
    const r298 = restaurants.find(r => r.id === 298);
    if (r298) {
        console.log(`Updating ID 298 image from "${r298.image}" to "https://i.ibb.co/3ykJ7Q8J/image.jpg"`);
        r298.image = "https://i.ibb.co/3ykJ7Q8J/image.jpg";
    } else {
        console.warn("ID 298 not found!");
    }

    // Reconstruct file content
    const newContent = `export const initialRestaurants = ${JSON.stringify(restaurants, null, 4)};

export const MAIN_VIDEO_LINK = 'https://www.facebook.com/kulaifoodmap';
`;

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("File saved successfully with restored export and ID 298 update.");
}

run();
