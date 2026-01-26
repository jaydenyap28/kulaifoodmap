import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/data/restaurants.js');

// Helper to format opening hours
function formatOpeningHours(hoursStr) {
    if (!hoursStr) return "";
    
    // Normalize string
    const cleanStr = hoursStr.trim();
    if (!cleanStr) return "";

    const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    // Check if it contains "Closed" or day names
    const hasDays = /Mon|Tue|Wed|Thu|Fri|Sat|Sun|Closed/i.test(cleanStr);

    if (!hasDays) {
        // Assume daily
        return daysOfWeek.map(day => `${day}: ${cleanStr}`).join('\n');
    }

    // Simple parser for "Time range Day Closed"
    // e.g. "8 am–6 pm Mon Closed"
    // Regex to capture time part and closed day part
    // This is a basic attempt; if it fails, return original
    try {
        const closedMatch = cleanStr.match(/^(.*?)\s+([a-zA-Z]+)\s+Closed$/i);
        if (closedMatch) {
            const timePart = closedMatch[1].trim();
            const closedDayShort = closedMatch[2].trim().toLowerCase(); // e.g. "mon"
            
            // Map short day to full day index
            const dayMap = {
                'mon': 'Monday', 'monday': 'Monday',
                'tue': 'Tuesday', 'tuesday': 'Tuesday',
                'wed': 'Wednesday', 'wednesday': 'Wednesday',
                'thu': 'Thursday', 'thursday': 'Thursday',
                'fri': 'Friday', 'friday': 'Friday',
                'sat': 'Saturday', 'saturday': 'Saturday',
                'sun': 'Sunday', 'sunday': 'Sunday'
            };
            
            const closedDayFull = dayMap[closedDayShort];
            if (closedDayFull) {
                return daysOfWeek.map(day => {
                    if (day === closedDayFull) {
                        return `${day}: Closed`;
                    } else {
                        return `${day}: ${timePart}`;
                    }
                }).join('\n');
            }
        }
    } catch (e) {
        // Ignore errors, fallback to original
    }

    return cleanStr;
}

// Data for new restaurants
const newRestaurantsData = [
    {
        name: "118 Kopitiam",
        address: "1337, Jln Lagenda 47, Taman Lagenda Putra, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6am-10pm",
        category: ["咖啡店"]
    },
    {
        name: "巴尚饮食阁",
        name_en: "Pasang Kopitiam",
        address: "1336, Jln Lagenda 47, Taman Lagenda Putra, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6am-10pm",
        category: ["咖啡店"]
    },
    {
        name: "Jibril Corner",
        address: "Jalan Lagenda 48, Taman Lagenda Putra, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "8am–6pm Mon Closed",
        category: ["马来餐"],
        website_link: "http://jibrilcorner.weebly.com/"
    },
    {
        name: "眉山大酒家",
        name_en: "Meisan Restaurant",
        address: "Jln Alor Bukit Johor,Taman Lagenda Putra Kulai",
        opening_hours: "", // Missing
        category: ["宴会酒楼"] // Inferred from "酒家"
    },
    {
        name: "BD NASRI TOMYAM",
        address: "1408, Jln Lagenda 51, Taman Lagenda Putra, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "", // Missing
        category: ["马来餐"]
    },
    {
        name: "Azlan Seafood",
        address: "Jln Alor Bukit, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "5pm-2am",
        category: ["马来餐"],
        website_link: "https://www.facebook.com/profile.php?id=100063502392525#"
    },
    {
        name: "桃源饭店",
        address: "Jln Alor Bukit, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "4pm-10pm mon closed",
        category: ["煮炒海鲜楼"]
    },
    {
        name: "Kedai Makan Kak Sal (Selera Kelantan)",
        address: "477, Jalan Gemilang 6, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6am-5pm",
        category: ["马来餐"]
    },
    {
        name: "Restoran Gear Box",
        address: "453, Jalan Gemilang 6, Taman Gunung Pulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "4pm–11pm wed closed",
        category: ["马来餐"]
    },
    {
        name: "财记点心",
        address: "59, Jalan Anggerik 3, Taman Kulai Utama, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7am-1pm Wed Closed",
        category: ["点心"]
    },
    {
        name: "华新茶室",
        name_en: "Charcoal Bean Cafe",
        address: "39, Lorong Isimail 2, Taman Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7am-4pm Thursday Closed",
        category: ["Cafe"] // Will map to correct category if needed
    },
    {
        name: "Restoran Asam Pedas Aeshah",
        address: "PTB 1824, Jalan Lengkongan, Kampung Baru Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7am–5pm Sat Closed",
        category: ["马来餐"]
    },
    {
        name: "Ina Tom Yam Sea Food",
        address: "46, Jalan Susur Kulai 4, Taman Sri Kulai Baru, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6pm–2am Sun Closed",
        category: ["马来餐"]
    },
    {
        name: "联邦蛋糕西点",
        name_en: "Kedai Kek Lian Pang",
        address: "No.6, Jalan Susur Kulai 4, Taman Sri Kulai Baru, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "9am–7pm",
        category: ["蛋糕甜点"] // Inferred
    },
    {
        name: "新天兴海鲜餐馆",
        name_en: "Restoran Kedai Makan Tian Heng",
        address: "Jln Selamat, Taman Mas, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "", // Missing
        category: ["咖啡店"]
    }
];

// Main execution
try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Find and Update "Good Coffee"
    // Look for id matching Good Coffee or name
    // We'll search by name to be safe
    let updatedCount = 0;
    
    // Handle "export const initialRestaurants =" or "export default"
    let jsonContent = content.replace(/^export\s+(?:const\s+\w+|default)\s*=\s*/, '');
    // Remove trailing semicolon if present
    jsonContent = jsonContent.replace(/;\s*$/, '');
    
    const restaurants = JSON.parse(jsonContent);
    
    const goodCoffee = restaurants.find(r => r.name === "咖啡好美食阁" || r.name_en === "Good Coffee Restaurant");
    if (goodCoffee) {
        console.log(`Found Good Coffee: ${goodCoffee.name}. Updating hours...`);
        const newHours = formatOpeningHours(goodCoffee.opening_hours);
        if (newHours !== goodCoffee.opening_hours) {
            goodCoffee.opening_hours = newHours;
            console.log(`Updated Good Coffee hours to:\n${newHours}`);
            updatedCount++;
        }
    } else {
        console.log("Good Coffee not found.");
    }

    // 2. Add New Restaurants
    // Find max ID
    const maxId = restaurants.reduce((max, r) => Math.max(max, r.id), 0);
    let nextId = maxId + 1;

    console.log(`Max ID: ${maxId}. Adding ${newRestaurantsData.length} new restaurants starting from ${nextId}.`);

    newRestaurantsData.forEach(data => {
        const formattedHours = formatOpeningHours(data.opening_hours);
        
        const newRestaurant = {
            id: nextId++,
            name: data.name,
            name_en: data.name_en || "",
            address: data.address,
            opening_hours: formattedHours,
            intro_zh: "",
            intro_en: "",
            category: data.category || [],
            categories: data.category || [],
            rating: 0,
            image: "https://placehold.co/600x400/png?text=No+Image",
            subStalls: [],
            price_range: "RM 10-20",
            menu_link: "",
            website_link: data.website_link || "",
            delivery_link: "",
            isVegetarian: false,
            isNoBeef: false,
            manualStatus: "auto",
            branches: [],
            tags: [],
            subscriptionLevel: 0,
            isVIP: false,
            priority: 0,
            whatsappLink: "",
            location: { lat: null, lng: null },
            phone: ""
        };
        
        restaurants.push(newRestaurant);
    });

    // 3. Save back to file
    const newContent = `export const initialRestaurants = ${JSON.stringify(restaurants, null, 4)};`;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Successfully updated restaurants.js. Total restaurants: ${restaurants.length}`);

} catch (err) {
    console.error("Error:", err);
}
