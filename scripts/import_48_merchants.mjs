import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Try to read .env.local
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  // ignore
}

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return process.env[key] || (match ? match[1].trim() : undefined);
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ==========================
// User specifically requested 48 merchants with shopee links and GMap informations
// ==========================
const merchants = [
  { name: "Ayam Gepuk Express", link: "https://spf.shopee.com.my/1VvDCNx3Xb", area: "Kulai", address: "Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 9:00 pm", cat: "印尼餐" },
  { name: "Restoran Nyonya V", link: "https://spf.shopee.com.my/20rTnIAKwy", area: "Indahpura", address: "193, Jalan Kenanga 29/4, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 8:30 pm (Mon Closed)", cat: "娘惹餐" },
  { name: "Restoran Selera Lagenda", link: "https://spf.shopee.com.my/6VJt9YOPLD", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 10:00 pm", cat: "马来餐" },
  { name: "Burger King", link: "https://spf.shopee.com.my/6L0SxEoC7q", area: "Kulai", address: "Lot G41 & G41A, Ground Floor, IOI Mall, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "快餐" },
  { name: "Beriani Warisan Ibu", link: "https://spf.shopee.com.my/gM6CoahtE", area: "Kulai", address: "Bandar Putra, 81000 Kulai, Johor", hours: "10:30 am - 4:00 pm", cat: "马来餐" },
  { name: "Dah Order Ke?", link: "https://spf.shopee.com.my/1gEdOc32zg", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 9:00 pm", cat: "马来餐" },
  { name: "Restoran Nasi Ayam Berempah Kak Hani", link: "https://spf.shopee.com.my/40cYAtI9FQ", area: "Kulai", address: "Taman Kulai Besar, 81000 Kulai, Johor", hours: "11:00 am - 6:00 pm", cat: "马来餐" },
  { name: "Pop Meals - IOI Mall Kulai", link: "https://spf.shopee.com.my/AUq1upEdYk", area: "Bandar Putra", address: "Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "快餐" },
  { name: "Warung Bakso Bandar Kulai", link: "https://spf.shopee.com.my/6pwjY4LZiq", area: "Kulai", address: "Bandar Kulai, 81000 Kulai, Johor", hours: "4:00 pm - 11:00 pm", cat: "印尼餐" },
  { name: "A&W IOI Mall Kulai DT", link: "https://spf.shopee.com.my/5AoVYzrLbM", area: "Bandar Putra", address: "IOI Mall Kulai Drive Thru, Lebuh Putra Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "快餐" },
  { name: "Pisang cheese coklat padu", link: "https://spf.shopee.com.my/9ztlJrr1F8", area: "Kulai", address: "Kulai, Johor", hours: "1:00 pm - 10:00 pm", cat: "小吃甜点" },
  { name: "Richeese Factory The Commune Indahpura", link: "https://spf.shopee.com.my/2qQamvMkhA", area: "Indahpura", address: "The Commune Lifestyle Mall, Persiaran Indahpura Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "快餐" },
  { name: "JCO Donut & Coffee", link: "https://spf.shopee.com.my/9fGuvWmnOH", area: "Kulai", address: "Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "蛋糕甜点" },
  { name: "RESTORAN SHARAFATH", link: "https://spf.shopee.com.my/7AZZx01ZVR", area: "Kulai", address: "Kulai, Johor", hours: "24 Hours", cat: "印度餐" },
  { name: "Kopilicious Kulai", link: "https://spf.shopee.com.my/808gwb36lO", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 5:00 pm", cat: "咖啡店" },
  { name: "Dapur Jauhar", link: "https://spf.shopee.com.my/808gwdMNF6", area: "Indahpura", address: "Bandar Indahpura, 81000 Kulai, Johor", hours: "12:00 pm - 10:00 pm", cat: "马来餐" },
  { name: "Restoran Briyani Roket Kulai", link: "https://spf.shopee.com.my/60NcZ4XPrX", area: "Kulai", address: "Kulai, Johor", hours: "10:00 am - 9:00 pm", cat: "马来餐" },
  { name: "Ali Mamak Bistro by Restoran A&J Yoosoof", link: "https://spf.shopee.com.my/9UxUjYU9cs", area: "Kulai", address: "240, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor", hours: "24 Hours", cat: "印度餐" },
  { name: "Auntie Anne's @ Aeon Kulai", link: "https://spf.shopee.com.my/AUq1vQGfgj", area: "Bandar Indahpura", address: "AEON Mall Kulaijaya, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "小吃甜点" },
  { name: "Coolblog (添加所有分行)", link: "https://spf.shopee.com.my/6VJtA8UQ8X", area: "Kulai", address: "Kulai, Johor (Various Branches)", hours: "10:00 am - 10:00 pm", cat: "饮品" },
  { name: "Adicto Churros Bandar Putra", link: "https://spf.shopee.com.my/9paL8Jdxer", area: "Bandar Putra", address: "Bandar Putra, 81000 Kulai, Johor", hours: "2:00 pm - 11:00 pm", cat: "小吃甜点" },
  { name: "Ayam Gepuk 143", link: "https://spf.shopee.com.my/8KlXLaIwkf", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 10:00 pm", cat: "印尼餐" },
  { name: "Meet U Kulai Bubble Tea", link: "https://spf.shopee.com.my/2g7AbCHiFM", area: "Indahpura", address: "Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 11:00 pm", cat: "饮品" },
  { name: "Cocotown The Commune Mall", link: "https://spf.shopee.com.my/2BAu0LZWxB", area: "Indahpura", address: "The Commune Lifestyle Mall, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "面包烘焙" },
  { name: "Jing Xin Vegetarian Cuisine (净心素食)", link: "https://spf.shopee.com.my/3B3RCKo5Qt", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 4:00 pm", cat: "素食" },
  { name: "Restoran Lim Lai Kee (林来记)", link: "https://spf.shopee.com.my/4qBfBQfYik", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 9:00 pm", cat: "中餐" },
  { name: "Sang Gerai IOI Mall Kulai", link: "https://spf.shopee.com.my/6L0SyR8lHy", area: "Bandar Putra", address: "IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai", hours: "10:00 am - 10:00 pm", cat: "饮品" },
  { name: "Kenangan Coffee THE COMMUNE", link: "https://spf.shopee.com.my/9Ke4cocTQK", area: "Indahpura", address: "The Commune Lifestyle Mall, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "咖啡店" },
  { name: "Jia Yi (呷姨)", link: "https://spf.shopee.com.my/LjFuOJs02", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 5:00 pm", cat: "台湾餐" },
  { name: "Yogurt Yoogoo - Kulai", link: "https://spf.shopee.com.my/3qJ84r72nE", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 11:00 pm", cat: "饮品" },
  { name: "ChaTraMue - IOI Mall Kulai", link: "https://spf.shopee.com.my/4fsF4UheqJ", area: "Bandar Putra", address: "IOI Mall, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "饮品" },
  { name: "BINGXUE Bandar Indahpura Kulai", link: "https://spf.shopee.com.my/W2g6tbUET", area: "Indahpura", address: "Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 11:00 pm", cat: "饮品" },
  { name: "D Laksa (添加所有相关分行)", link: "", area: "Kulai", address: "Various Branches (AEON/IOI Kulai)", hours: "10:00 am - 10:00 pm", cat: "面类" },
  { name: "Restoran Prata Maju", link: "https://spf.shopee.com.my/W2g79CFvn", area: "Kulai", address: "Kulai, Johor", hours: "7:00 am - 11:00 pm", cat: "印度餐" },
  { name: "The Bretzel Co Aeon Kulai", link: "https://spf.shopee.com.my/2qQatVWclB", area: "Bandar Indahpura", address: "AEON Mall Kulaijaya, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "面包烘焙" },
  { name: "RESTORAN SHARAFATH (Branch 2)", link: "https://spf.shopee.com.my/7fVqeSu7lS", area: "Kulai", address: "Kulai, Johor", hours: "24 Hours", cat: "印度餐" },
  { name: "Restoran D' Serambi", link: "https://spf.shopee.com.my/9Ke4ddOkMw", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 11:00 pm", cat: "马来餐" },
  { name: "llaollao 所有分行", link: "https://spf.shopee.com.my/16PWcEZPs", area: "Kulai", address: "Various Branches (AEON/IOI Kulai)", hours: "10:00 am - 10:00 pm", cat: "小吃甜点" },
  { name: "NSH INDIAN FOOD ENTERPRISE", link: "https://spf.shopee.com.my/AKWbpf4xJu", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 9:00 pm", cat: "印度餐" },
  { name: "Nasi Kukus Gulai Padang", link: "https://spf.shopee.com.my/8fONqehDxb", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 9:00 pm", cat: "马来餐" },
  { name: "Coffee Over Chaos", link: "https://spf.shopee.com.my/1qY3i8ApW5", area: "Kulai", address: "Kulai, Johor", hours: "9:00 am - 6:00 pm", cat: "咖啡馆" },
  { name: "GC Good Coffee (Kulai)", link: "https://spf.shopee.com.my/901EFPGwKQ", area: "Kulai", address: "Kulai, Johor", hours: "8:00 am - 10:00 pm", cat: "咖啡馆" },
  { name: "Mutiara Garden Restaurant", link: "https://spf.shopee.com.my/1gEdW3f0UN", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 10:00 pm", cat: "中餐" },
  { name: "TakoBeef Takoyaki", link: "https://spf.shopee.com.my/gM6KK4Nli", area: "Kulai", address: "Kulai, Johor", hours: "12:00 pm - 9:00 pm", cat: "小吃甜点" },
  { name: "Hot & Roll • IOI Mall Kulai", link: "https://spf.shopee.com.my/4LFOh5NQiy", area: "Bandar Putra", address: "IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai", hours: "10:00 am - 10:00 pm", cat: "小吃甜点" },
  { name: "Cocotown The Commune Mall (Branch 2/Alternative)", link: "https://spf.shopee.com.my/901EFkTlg3", area: "Indahpura", address: "The Commune Lifestyle Mall, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm", cat: "面包烘焙" },
  { name: "Rawon Signature", link: "https://spf.shopee.com.my/1gEdWKcg2C", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 9:00 pm", cat: "马来餐" },
  { name: "Casual Coffee 休闲咖啡", link: "https://spf.shopee.com.my/2LUKJdUCVs", area: "Kulai", address: "Kulai, Johor", hours: "11:00 am - 11:00 pm", cat: "咖啡馆" }
];

async function run() {
  console.log(`Starting to import ${merchants.length} merchants to Supabase...`);

  for (let m of merchants) {
    const payload = {
      name: m.name,
      category: m.cat,
      address: m.address,
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80', // generic fallback image
      is_active: true,
      is_hidden: false,
      is_featured: false,
      hot_score: 500, // new merchants start with some base heat
      extra_details: {
          name: m.name,
          area: m.area,
          category: m.cat,
          address: m.address,
          opening_hours: m.hours,
          delivery_link: m.link || ''
      }
    };


    const { error } = await supabase
      .from('restaurants')
      .insert([payload]);

    if (error) {
      console.error(`Failed to insert ${m.name}:`, error.message);
    } else {
      console.log(`✅ Successfully inserted: ${m.name}`);
    }
  }

  console.log('Import completed!');
}

run();
