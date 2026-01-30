const fs = require('fs');
const path = require('path');

const restaurantsFilePath = path.join(__dirname, '../src/data/restaurants.js');

let content = fs.readFileSync(restaurantsFilePath, 'utf8');

const startMarker = 'export const restaurants = [';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find start marker');
    process.exit(1);
}

let arrayContentStart = startIndex + startMarker.length - 1;
let arrayContentEnd = -1;
let balance = 0;
let inString = false;
let escape = false;
let quoteChar = '';

for (let i = arrayContentStart; i < content.length; i++) {
    const char = content[i];
    
    if (escape) {
        escape = false;
        continue;
    }
    
    if (char === '\\') {
        escape = true;
        continue;
    }
    
    if (inString) {
        if (char === quoteChar) {
            inString = false;
        }
    } else {
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            quoteChar = char;
        } else if (char === '[') {
            balance++;
        } else if (char === ']') {
            balance--;
            if (balance === 0) {
                arrayContentEnd = i + 1;
                break;
            }
        }
    }
}

if (arrayContentEnd === -1) {
    console.error('Could not find end of array');
    process.exit(1);
}

const arrayString = content.substring(arrayContentStart, arrayContentEnd);

let restaurants;
try {
    restaurants = JSON.parse(arrayString);
} catch (e) {
    console.log('JSON.parse failed, trying eval');
    try {
        restaurants = eval('(' + arrayString + ')');
    } catch (e2) {
        console.error('Failed to parse restaurants array:', e2);
        process.exit(1);
    }
}

console.log(`Loaded ${restaurants.length} restaurants.`);

// --- DELETIONS ---
const idsToDelete = [13, 15, 20, 21, 23, 25, 26, 28, 32, 37, 301, 351, 416];
const originalCount = restaurants.length;
restaurants = restaurants.filter(r => !idsToDelete.includes(r.id));
console.log(`Deleted ${originalCount - restaurants.length} restaurants.`);

// --- UPDATES ---
const updates = {
    16: (r) => { // Nasi Lemak Wak Kentut
        r.intro_zh = "闻名全马的古来Nasi Lemak。炸鸡酥脆多汁，椰浆饭香气浓郁，最关键的是其特制的Sambal辣椒酱，甜辣适中，让人回味无穷。";
        r.intro_en = "Kulai's Nasi Lemak that is famous throughout Malaysia. Features crispy and juicy fried chicken, fragrant coconut rice, and a signature Sambal sauce that is perfectly balanced in sweetness and spiciness.";
    },
    38: (r) => { // Three And A Half
        r.intro_zh = "古来一家 小巧特色咖啡馆，位于 独特的后巷空间，环境舒适。主打 热压吐司（如乌打芝士口味） 与 香煎吐司，搭配 香浓传统咖啡 和 半熟蛋，是早餐或午茶的好选择。";
        r.intro_en = "Located in a unique 3.5-story building with a cozy atmosphere. Specializes in pressed toast sandwiches (such as Otak Cheese) and grilled toast, served with aromatic traditional coffee and soft-boiled eggs.";
    },
    41: (r) => { // Tofu Lao
        r.intro_zh = "这里的咖哩叻沙汤头浓郁，椰浆味香醇。配料丰富，包括鲜蛤、豆卜、鱼饼等。特别是他们的酿豆腐，更是必点美味。";
        r.intro_en = "Their Curry Laksa features a rich broth with aromatic coconut milk. Generous toppings include fresh cockles, tau pok, and fish cake. Their Yong Tau Foo is also a must-try.";
    },
    76: (r) => { // Pontian Coffee 9
        r.intro_zh = "著名的传统咖啡店，源自笨珍。以其香浓的传统咖啡、烤面包和半生熟蛋闻名。也提供云吞面、叻沙等本地美食，是享用南洋早餐的好去处。";
        r.intro_en = "A famous traditional coffee shop originating from Pontian. Known for its aromatic traditional coffee, toast, and soft-boiled eggs. Also serves Wanton Mee and Laksa. A great spot for a Nanyang breakfast.";
        r.whatsappLink = "";
    },
    33: (r) => { // KFC
        r.branches = [
            { name: "KFC @ Kulai (Jalan Susur 3)", address: "Jalan Susur Kulai 3, Taman Kulai Besar, 81000 Kulai, Johor" },
            { name: "KFC IOI Mall Kulai", address: "Lot G-18, Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor" },
            { name: "KFC Kulai Drive Thru", address: "PTD 102570, Jalan Alor Bukit, Taman Kulai, 81000 Kulai, Johor" },
            { name: "KFC AEON Kulaijaya", address: "Lot G36, Ground Floor, AEON Mall Kulaijaya, Pesiaran Indahpura, Bandar Indahpura, 81000 Kulai, Johor" },
            { name: "KFC Lotus's Kulai", address: "Lot G18, Ground Floor, Lotus's Kulai, No. 50, Jalan Seroja, Taman Kulai Besar, 81000 Kulai, Johor" },
            { name: "KFC Senai", address: "No. 11, Jalan Belimbing 1, Taman Sri Senai, 81400 Senai, Johor" },
            { name: "KFC Senai Airport", address: "Lot G23, Ground Floor, Senai International Airport, 81250 Johor Bahru, Johor" }
        ];
    },
    34: (r) => { // McDonald's
        r.branches = [
            { name: "McDonald's Kulai DT", address: "Lot 1495, Jalan Kulai-Air Hitam, 81000 Kulai, Johor" },
            { name: "McDonald's IOI Mall", address: "Lot G-35, Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor" },
            { name: "McDonald's AEON Kulai", address: "Lot G37, Ground Floor, AEON Mall Kulaijaya, Pesiaran Indahpura, Bandar Indahpura, 81000 Kulai, Johor" },
            { name: "McDonald's Senai DT", address: "Lot 483, Jalan Lapangan Terbang, 81400 Senai, Johor" },
            { name: "McDonald's Senai Airport", address: "Lot G1, Ground Floor, Senai International Airport, 81250 Johor Bahru, Johor" }
        ];
    }
};

restaurants.forEach(r => {
    if (updates[r.id]) {
        updates[r.id](r);
    }
});

// --- ADDITIONS ---
const maxId = restaurants.reduce((max, r) => Math.max(max, r.id), 0);
let nextId = maxId + 1;

const newMerchants = [
    {
        name: "新强记烧腊",
        name_en: "Restoran Sin Keong Kee",
        area: "Indahpura",
        address: "220, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor",
        opening_hours: "8am - 4pm (Closed on Tue)",
        intro_zh: "古来著名的烧腊店，主打炭烧烧鸭、烧肉和叉烧。烧鸭皮脆肉嫩，油脂丰富；烧肉皮脆肉香。是许多古来人午餐的首选。",
        intro_en: "A famous roasted meat shop in Kulai, specializing in charcoal-roasted duck, roasted pork (Siew Yoke), and Char Siew. The roasted duck is known for its crispy skin and juicy meat.",
        tags: ["烧腊", "午餐"],
        category: ["饭类", "咖啡店/美食阁"],
        categories: ["饭类", "咖啡店/美食阁"],
        halalStatus: "non_halal",
        image: "",
        price_range: "RM 10-20",
        rating: 0,
        phone: "012-770 6933",
        branches: [],
        subStalls: [],
        location: { lat: null, lng: null }
    },
    {
        name: "Lapan Kati 8斤",
        name_en: "Lapan Kati",
        area: "Kulai",
        address: "27, Lorong Ismail, Taman Kulai, 81000 Kulai, Johor",
        opening_hours: "5pm - 12am (Closed on Mon)",
        intro_zh: "位于古来后巷的特色小酒馆，环境复古有情调。主打各式精酿啤酒、特调饮料和佐酒小吃。是夜晚放松、朋友聚会的好地方。",
        intro_en: "A unique bistro located in the back alley of Kulai, featuring a retro and atmospheric setting. Specializes in craft beers, signature drinks, and bar snacks. A great place for evening relaxation and gathering with friends.",
        tags: ["喝酒", "宵夜", "聚会"],
        category: ["Cafe", "马来与印度风味"],
        categories: ["Cafe"],
        halalStatus: "non_halal",
        image: "",
        price_range: "RM 20-40",
        rating: 0,
        phone: "016-711 7777",
        branches: [],
        subStalls: [],
        location: { lat: null, lng: null }
    }
];

newMerchants.forEach(m => {
    m.id = nextId++;
    restaurants.push(m);
});

console.log(`Added ${newMerchants.length} new restaurants.`);

const newContent = content.substring(0, arrayContentStart) + JSON.stringify(restaurants, null, 4) + content.substring(arrayContentEnd);
fs.writeFileSync(restaurantsFilePath, newContent);
console.log('Done.');
