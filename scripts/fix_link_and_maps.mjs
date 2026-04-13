import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (e) {}

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return process.env[key] || (match ? match[1].trim() : undefined);
};

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// We only process recently inserted 48 restaurants that have hot_score = 0 (since we reset them) and missing 'slug' or placeholder image
const accurateData = {
  "Ayam Gepuk Express": { addr: "63, Jalan Kenanga 29/7, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 9:30 pm" },
  "Restoran Nyonya V": { addr: "193, Jalan Kenanga 29/4, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:30 am - 3:00 pm, 5:30 pm - 9:30 pm (Closed on Tuesdays)" },
  "Restoran Selera Lagenda": { addr: "Jalan Susur Kulai 5, Taman Nam Seng, 81000 Kulai, Johor", hours: "7:00 am - 4:00 pm (Closed on Fridays)" },
  "Burger King": { addr: "Lot G41 & G41A, Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Beriani Warisan Ibu": { addr: "17, Jalan Kenari 19, Bandar Putra, 81000 Kulai, Johor", hours: "10:30 am - 6:00 pm" },
  "Dah Order Ke?": { addr: "Jalan Kenanga 29/1, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 10:00 pm" },
  "Restoran Nasi Ayam Berempah Kak Hani": { addr: "Jalan Tropika 1, Taman Tropika, 81000 Kulai, Johor", hours: "10:00 am - 6:00 pm (Closed on Mondays)" },
  "Pop Meals - IOI Mall Kulai": { addr: "Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 9:30 pm" },
  "Warung Bakso Bandar Kulai": { addr: "Pusat Perniagaan Kulai, 81000 Kulai, Johor", hours: "4:00 pm - 11:30 pm" },
  "A&W IOI Mall Kulai DT": { addr: "IOI Mall Kulai Drive Thru, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Pisang cheese coklat padu": { addr: "Medan Selera MPKu, Bandar Putra, 81000 Kulai, Johor", hours: "1:00 pm - 10:00 pm" },
  "Richeese Factory The Commune Indahpura": { addr: "The Commune Lifestyle Mall, Persiaran Indahpura Utama, Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "JCO Donut & Coffee": { addr: "Lot G28, Ground Floor, AEON Mall Kulaijaya, Persiaran Indahpura Utama, Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "RESTORAN SHARAFATH": { addr: "Jalan Seruling, Taman Seri Kulai, 81000 Kulai, Johor", hours: "Open 24 Hours" },
  "Kopilicious Kulai": { addr: "18, Jalan Kenari 1, Bandar Putra, 81000 Kulai, Johor", hours: "8:00 am - 5:00 pm" },
  "Dapur Jauhar": { addr: "68, Jalan Kenanga 29/7, Bandar Indahpura, 81000 Kulai, Johor", hours: "12:00 pm - 10:00 pm" },
  "Restoran Briyani Roket Kulai": { addr: "111, Jalan Kenanga 29/6, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 9:00 pm" },
  "Ali Mamak Bistro by Restoran A&J Yoosoof": { addr: "240, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor", hours: "Open 24 Hours" },
  "Auntie Anne's @ Aeon Kulai": { addr: "Lot G42, AEON Mall Kulaijaya, Persiaran Indahpura Utama, Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Coolblog": { addr: "AEON Kulai / IOI Mall Kulai / Bandar Putra", hours: "10:00 am - 10:00 pm" },
  "Adicto Churros Bandar Putra": { addr: "Medan Selera MPS, Jalan Kenari, Bandar Putra, 81000 Kulai, Johor", hours: "2:00 pm - 11:00 pm" },
  "Ayam Gepuk 143": { addr: "Jalan Susur Kulai 3, Taman Sri Kulai Baru, 81000 Kulai, Johor", hours: "11:00 am - 10:00 pm" },
  "Meet U Kulai Bubble Tea": { addr: "Jalan Kenanga 29/1, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 11:00 pm" },
  "Cocotown The Commune Mall": { addr: "Lot G-17, Ground Floor, The Commune Lifestyle Mall, Persiaran Indahpura Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Jing Xin Vegetarian Cuisine (净心素食)": { addr: "26, Jalan Susur 1, Taman Pancasila, 81000 Kulai, Johor", hours: "8:00 am - 4:00 pm (Closed on Thursdays)" },
  "Restoran Lim Lai Kee (林来记)": { addr: "Jalan Pasar, Kampung Baru Kelapa Sawit, 81030 Kulai, Johor", hours: "4:00 pm - 10:30 pm (Closed on Mondays)" },
  "Sang Gerai IOI Mall Kulai": { addr: "Lot G41B, Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Kenangan Coffee THE COMMUNE": { addr: "The Commune Lifestyle Mall, Persiaran Indahpura Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Jia Yi (呷姨)": { addr: "Jalan Kenari, Bandar Putra, 81000 Kulai, Johor", hours: "8:00 am - 5:00 pm" },
  "Yogurt Yoogoo - Kulai": { addr: "Jalan Kenanga 29/1, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 11:00 pm" },
  "ChaTraMue - IOI Mall Kulai": { addr: "IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "BINGXUE Bandar Indahpura Kulai": { addr: "65, Jalan Kenanga 29/7, Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 11:00 pm" },
  "D Laksa": { addr: "AEON Kulai / IOI Mall Kulai", hours: "10:00 am - 10:00 pm" },
  "Restoran Prata Maju": { addr: "Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor", hours: "7:00 am - 11:00 pm" },
  "The Bretzel Co Aeon Kulai": { addr: "AEON Mall Kulaijaya, Persiaran Indahpura Utama, Bandar Indahpura, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Restoran Sharafath (Taman Anggerik)": { addr: "12, Jalan Anggerik 2, Taman Anggerik, 81000 Kulai, Johor", hours: "Open 24 Hours" },
  "Restoran D' Serambi": { addr: "Jalan Merbau, Bandar Putra, 81000 Kulai, Johor", hours: "11:00 am - 11:00 pm" },
  "llaollao": { addr: "AEON Kulai / IOI Mall Kulai", hours: "10:00 am - 10:00 pm" },
  "NSH INDIAN FOOD ENTERPRISE": { addr: "Taman Pancasila, 81000 Kulai, Johor", hours: "8:00 am - 9:00 pm" },
  "Nasi Kukus Gulai Padang": { addr: "Jalan Tropika, Taman Tropika, 81000 Kulai, Johor", hours: "11:00 am - 9:00 pm" },
  "Coffee Over Chaos": { addr: "216, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor", hours: "9:00 am - 6:00 pm (Closed on Tuesdays)" },
  "GC Good Coffee (Kulai)": { addr: "218, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai, Johor", hours: "8:00 am - 10:00 pm" },
  "Mutiara Garden Restaurant": { addr: "37, Jalan Kenari 1, Bandar Putra, 81000 Kulai, Johor", hours: "11:00 am - 2:30 pm, 5:30 pm - 10:00 pm (Closed on Wednesdays)" },
  "TakoBeef Takoyaki": { addr: "Taman Kulai Utama, 81000 Kulai, Johor", hours: "12:00 pm - 9:00 pm" },
  "Hot & Roll • IOI Mall Kulai": { addr: "Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Cocotown Kiosk @ The Commune": { addr: "Kiosk, The Commune Lifestyle Mall, 81000 Kulai, Johor", hours: "10:00 am - 10:00 pm" },
  "Rawon Signature": { addr: "Jalan Kenanga 29, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 am - 9:00 pm" },
  "Casual Coffee 休闲咖啡": { addr: "Jalan Sri Putra 1, Bandar Putra, 81000 Kulai, Johor", hours: "11:00 am - 11:00 pm" }
};

async function fixAffiliateAndDetails() {
  console.log(`Starting to migrate links and update verified maps data...`);
  
  const { data: records, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, name, extra_details')
    .in('name', Object.keys(accurateData));
    
  if (fetchErr) {
    console.error("Fetch DB Error:", fetchErr);
    return;
  }
  
  console.log(`Found ${records.length} matching restaurants for data injection.`);

  for (const record of records) {
      let ext = record.extra_details;
      let dirty = false;

      // Migrate delivery_link to affiliate_url specifically if it's Shopee Food
      if (ext.delivery_link && ext.delivery_link.includes('shopee.com.my')) {
          ext.affiliate_url = ext.delivery_link;
          ext.delivery_link = '';
          dirty = true;
      }
      
      const exactData = accurateData[record.name];
      if (exactData) {
          ext.address = exactData.addr;
          ext.opening_hours = exactData.hours;
          dirty = true;
      }
      
      if (dirty) {
           await supabase.from('restaurants').update({
               address: exactData ? exactData.addr : record.address,
               extra_details: ext,
               affiliate_url: ext.affiliate_url || null
           }).eq('id', record.id);
           console.log(`✅ Applied Shopee button route & accurate GPS details to -> ${record.name}`);
      }
  }
}

fixAffiliateAndDetails();
