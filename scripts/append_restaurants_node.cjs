const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');

const newItemsRaw = [
    {
        name: "Qulai Pizza Kayu Api",
        name_en: "Qulai Pizza Kayu Api",
        address: "2023, Jalan Manggis, Kampung Pertanian, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "2pm–10:30 pm Mon closed",
        category: ["西餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6mhxNzpWBVZnjKix8gpP17igjAwiSpf0a7A&s"
    },

    {
        name: "Roti King Saleng",
        name_en: "Roti King Saleng",
        address: "Jalan Saleng 7, Kampung Baru Saleng, 81400 Senai, Johor Darul Ta'zim",
        opening_hours: "6 pm–1:30 am",
        category: ["马来餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDI_300Z3ZfxIIi__sJVY2zlXsBqrvWvISaA&s"
    },
    {
        name: "福临门",
        name_en: "Defortune Restaurant",
        address: "PTD 82181, Lebuh Putra Utama, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11:30 am–3 pm, 6–10:30 pm",
        category: ["宴会酒楼"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkUAARicQZ9dUP4gs0Vco3UB5WNzmECgxFUA&s"
    },
    {
        name: "AiCHA",
        name_en: "AiCHA",
        address: "2915, Jalan Merbau 3, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11 am–10 pm",
        category: ["饮品"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUR9d_F_qO6R-tFhpynldHpgZ2iU_NxkKnCQ&s"
    },
    {
        name: "Verbena Patisserie Shop",
        name_en: "Verbena Patisserie Shop",
        address: "2918, Jalan Merbau 3, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "9 am–7 pm",
        category: ["蛋糕甜点"],
        image: "https://cdn1.npcdn.net/images/1501326049338f70e6d312917c335b1e05698bea5f.jpg?md5id=55b815e096cacb06e3e556d22e8d106c&new_width=1200&new_height=1200&w=1676969628"
    },
    {
        name: "Nando's",
        name_en: "Nando's",
        address: "G-25, IOI Mall Kulai",
        opening_hours: "10 am–10 pm",
        category: ["西餐"],
        image: "https://nandos.com.my/wp-content/uploads/2024/11/WhatsApp-Image-2024-11-29-at-11.00.32-AM-1024x576.jpeg"
    },
    {
        name: "Ichiban Ramen",
        name_en: "Ichiban Ramen",
        address: "IOI MALL KULAI",
        opening_hours: "10 am–10 pm",
        category: ["日本餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMqLOiKOkaFIuGkk5lSgydQV4kwtOkaAxgJw&s"
    },
    {
        name: "Rengit Coffee by Dagan",
        name_en: "Rengit Coffee by Dagan",
        address: "G23A,Ground Floor,IOI Mall",
        opening_hours: "10 am–10 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCxiZZSO9G6WzT2uDpoFHnRRGOyeNR3r0cIA&s"
    },
    {
        name: "The Chicken Rice Shop",
        name_en: "The Chicken Rice Shop",
        address: "Lot No.G-29/30/30a/G-K-15, Ground Floor I0I Mall",
        opening_hours: "10 am–10 pm",
        category: ["饭类"],
        image: "https://www.ioicitymall.com.my/data/images/item/img_071127_chicken_rice_shop_front_.jpg"
    },
    {
        name: "家香咖啡馆",
        name_en: "Home Taste Coffee",
        address: "5013, Jalan Kenari, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "8am-3.30pm tuesday closed",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIPe-x9ybqjC5n-nLvonUXPWFRBQD6iOLSFQ&s"
    },
    {
        name: "Classic Coffee",
        name_en: "Classic Coffee",
        address: "5011, Jalan Kenari, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7 am–3:45 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvHJWAFlMt_PsdsQFUaB3cVkZZ5GAj3Y0fLQ&s"
    },
    {
        name: "Madam LoqLoq Kulai",
        name_en: "Madam LoqLoq Kulai",
        address: "5448A, Jalan Kenari 20, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "5 pm–1:30 am",
        category: ["火锅烧烤"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPfDSEXdMujBTM6xq92g_X13tkX0kvTDGF8w&s"
    },
    {
        name: "MKe Harmony Cafe",
        name_en: "MKe Harmony Cafe",
        address: "5457A, Jalan Kenari 20, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11 am–9 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfDgrblBCm0gESP4Dpdu4z6hVaqXJjkGO9Ow&s"
    },
    {
        name: "MON DELICE PATISSERIE",
        name_en: "MON DELICE PATISSERIE",
        address: "5383, Jalan Kenari 20, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "10 am–7 pm",
        category: ["蛋糕甜点"],
        image: "https://cdn.reviewbah.com/wp-content/uploads/2023/04/mon-delice-patisserie-bandar-putra-AF1QipPxFB4E-BK8vmFgtsBMy2d0roCMAZvR9jSmif-kw12003.jpg"
    },
    {
        name: "五福全蛋雲吞麵",
        name_en: "Sutera Mee Restaurant",
        address: "Kulai, Johor",
        opening_hours: "7 am–3:30 pm Tuesday Closed",
        category: ["面类"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFuWrM73BiN1TGD_nJka6JMOVx4Qg38B7KRA&s"
    },
    {
        name: "金霸王餐厅",
        name_en: "Kimbarking Cafe",
        address: "5481, Jalan Kenari 19, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "8 am–9:30 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtB0yjUYnKUgRy-ExZ5WymAUtcQQypjmqo3g&s"
    },
    {
        name: "咖啡好美食阁",
        name_en: "Good Coffee Restaurant",
        address: "5484, Jalan Kenari 19, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7:30 am–1:30 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFYuyWnUTNH2mcuuuA0quZbB9B0dQWVlGzVQ&s"
    },
    {
        name: "品记全蛋云吞面",
        name_en: "Yue Shan Cafe",
        address: "5427, Jalan Kenari 18, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "3–10 pm Mon Closed",
        category: ["面类"],
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        name: "#7 Beradik Restaurant",
        name_en: "#7 Beradik Restaurant",
        address: "5432, Jalan Kenari 18, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11:30 am–10 pm Sat Closed",
        category: ["马来餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbtWPJLxWTWgAK1VKMPDsS9EHe6BcyuHxYrg&s"
    },
    {
        name: "REDY.CAFE",
        name_en: "REDY.CAFE",
        address: "K1, IOI GALLERIA, Jalan Putra 4, Bandar Putra Kulai, 81000 Kulai, Johor",
        opening_hours: "4:30pm–11:30 pm Mon Closed",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkW8azMhW2MLk1GYNscnRMeWPJJSRfZHWwzw&s"
    },
    {
        name: "Nasi Ayam Angah",
        name_en: "Nasi Ayam Angah",
        address: "17147, Jalan Murai 4, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11 am-3:30 pm Friday Closed",
        category: ["马来餐"],
        image: "https://images.deliveryhero.io/image/fd-my/LH/p9gb-hero.jpg?width=480&height=360&quality=45"
    },
    {
        name: "华叔火蒸鸡",
        name_en: "Hua Shu Fire Steam Chicken",
        address: "94, 81000 Kulai, Johor",
        opening_hours: "10 am–3 pm, 5–9 pm MON CLOSED",
        category: ["饭类"],
        image: "https://i.ytimg.com/vi/qcB0dkk9Ag4/hqdefault.jpg"
    },
    {
        name: "古来欢乐炸鸡桶",
        name_en: "Chicky Don Ayam Goreng Paprika",
        address: "34, Jalan Seri Putra 1, Bandar Putra Kulai, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "12–7 pm Tuesday closed",
        category: ["西餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSusBzXBtqpZb-7Ve60r93LM2dOHg1heDRISQ&s"
    },
    {
        name: "罗记小食馆",
        name_en: "Restoran Law Cafe",
        address: "488, Jalan Kenanga 29/14, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6:45 am–4:15 pm Wed Closed",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi3-4gYrXPEPovN33QYrE-sOb6o2_XBBu08A&s"
    },
    {
        name: "酿品家餐厅",
        name_en: "酿品家餐厅",
        address: "487, Jalan Kenanga 29/14, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "6:30 am–3 pm Tuesday closed",
        category: ["面类"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuRt89xLZt3RT6sLGgvbVez5R3Oozml5jPjw&s"
    },
    {
        name: "鼎點心",
        name_en: "Ding DimSum",
        address: "459, Jalan Kenanga 29/13, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "7 am–4:30 pm Tue closed",
        category: ["点心"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3ZMhkI7oNgOqP4gktCgI6So4fV8M1nVSJzQ&s"
    },
    {
        name: "客家小食馆",
        name_en: "Kejia cafe",
        address: "340, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "8 am–3 pm Mon closed",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHSHppjBi5WX5YsImQ_wFXNQW5qQOZk6nOnw&s"
    },
    {
        name: "老巴刹",
        name_en: "Lao Pa Sat Kopitiam",
        address: "306, Jalan Kenanga 29/9, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "8:30 am–8:30 pm",
        category: ["咖啡店"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAbsQ4vsA2pK0Wvo9viwatkH4iNERKMwu6lg&s"
    },
    {
        name: "AkiNo Japanese Restaurant",
        name_en: "AkiNo Japanese Restaurant",
        address: "307, Jalan Kenanga 29/9, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "12–3 pm, 5:30–9:30 pm",
        category: ["日本餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd5hdPyIqTnnkVLztIS51XjagnK_ZY3NVplA&s"
    },
    {
        name: "六月西餐厅",
        name_en: "June Coffee Grill & Spaghetti",
        address: "303, Jalan Kenanga 29/9, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "11 am–10 pm",
        category: ["西餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJvPBROrVIZx2SeZIjbGPuGGrArulTiY_q-A&s"
    },
    {
        name: "泰啦啦",
        name_en: "THAI LALA",
        address: "352, Jalan Kenanga 29/9, Bandar Indahpura, 81000 Kulai, Johor Darul Ta'zim",
        opening_hours: "12 pm–12 am",
        category: ["泰国餐"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVJa5Z4G6Wnw5u3zeCsIaDSdeG9PAhGD62AQ&s"
    }
];

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Find max ID
    const idRegex = /"id":\s*(\d+)/g;
    let match;
    let maxId = 0;
    while ((match = idRegex.exec(fileContent)) !== null) {
        const id = parseInt(match[1], 10);
        if (id > maxId) maxId = id;
    }
    
    console.log(`Max ID found: ${maxId}`);
    
    let currentId = maxId + 1;
    const jsonObjects = newItemsRaw.map(item => {
        const entry = {
            id: currentId++,
            name: item.name,
            name_en: item.name_en,
            address: item.address,
            opening_hours: item.opening_hours,
            category: item.category,
            categories: item.category,
            rating: 0,
            image: item.image,
            subStalls: [],
            price_range: "RM 10-20",
            menu_link: "",
            website_link: "",
            delivery_link: "",
            isVegetarian: false,
            isNoBeef: false,
            manualStatus: "auto",
            branches: []
        };
        return JSON.stringify(entry, null, 2); // Indent with 2 spaces
    });
    
    const newContentString = jsonObjects.join(',\n');
    
    // Remove last ]; and append
    // Assuming file ends with ]; or ]
    // We look for the last occurrence of ] and replace it
    
    const closingBracketRegex = /];\s*$/;
    if (!closingBracketRegex.test(fileContent)) {
        throw new Error("Could not find closing '];' at the end of the file.");
    }
    
    // Check if the last item has a comma. If not, add one.
    // We can just add a comma blindly if we are sure it's valid, 
    // but better to check.
    // However, simplest way: replace `];` with `,` + content + `];`
    // If the previous item didn't have a comma, this is needed.
    // If it did, we get `,,` which is a sparse array but valid.
    // But we saw in Read that it does NOT have a comma.
    
    const newFileContent = fileContent.replace(closingBracketRegex, `,\n${newContentString}\n];`);
    
    // Write to a temp file first to avoid lock issues
    const tempFilePath = path.join(__dirname, '../src/data/restaurants_temp.js');
    fs.writeFileSync(tempFilePath, newFileContent, 'utf8');
    console.log("Successfully wrote to temp file.");
    
} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
