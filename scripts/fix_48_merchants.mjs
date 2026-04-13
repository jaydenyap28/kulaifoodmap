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

// We will update the records we just inserted.
// To do this, we match by name.
const updates = [
  { name: "Ayam Gepuk Express", address: "63, Jalan Kenanga 29/7, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:00 AM - 9:30 PM", image: "https://images.unsplash.com/photo-1626804475297-41609ea004be?auto=format&fit=crop&q=80" },
  { name: "Restoran Nyonya V", address: "193, Jalan Kenanga 29/4, Bandar Indahpura, 81000 Kulai, Johor", hours: "11:30 AM - 3:00 PM, 5:30 PM - 9:30 PM (Tuesday Closed)", image: "https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&q=80" },
  { name: "Restoran Selera Lagenda", address: "Jalan Susur Kulai 5, Taman Nam Seng, 81000 Kulai", hours: "7:00 AM - 4:00 PM", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80" },
  { name: "Burger King", address: "Lot G41 & G41A, Ground Floor, IOI Mall, Bandar Putra, 81000 Kulai, Johor", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80" },
  { name: "Beriani Warisan Ibu", address: "Bandar Putra, 81000 Kulai, Johor", hours: "10:30 AM - 6:00 PM", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80" },
  { name: "Dah Order Ke?", address: "Kulai, Johor", hours: "11:00 AM - 9:00 PM", image: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80" },
  { name: "Restoran Nasi Ayam Berempah Kak Hani", address: "Taman Kulai Besar, 81000 Kulai", hours: "10:00 AM - 5:00 PM", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80" },
  { name: "Pop Meals - IOI Mall Kulai", address: "Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, 81000 Kulai", hours: "10:00 AM - 9:30 PM", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80" },
  { name: "Warung Bakso Bandar Kulai", address: "Bandar Kulai, 81000 Kulai, Johor", hours: "2:00 PM - 11:00 PM", image: "https://images.unsplash.com/photo-1569420047249-14a0fa889212?auto=format&fit=crop&q=80" },
  { name: "A&W IOI Mall Kulai DT", address: "IOI Mall Kulai Drive Thru, Lebuh Putra Utama, 81000 Kulai, Johor", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&q=80" },
  { name: "Pisang cheese coklat padu", address: "Kulai, Johor", hours: "1:00 PM - 10:00 PM", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80" },
  { name: "Richeese Factory The Commune Indahpura", address: "The Commune Lifestyle Mall, Persiaran Indahpura Utama, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80" },
  { name: "JCO Donut & Coffee", address: "AEON Mall Kulaijaya, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80" },
  { name: "RESTORAN SHARAFATH", address: "Jalan Seruling, Taman Seri Kulai, 81000 Kulai", hours: "24 Hours", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80" },
  { name: "Kopilicious Kulai", address: "Bandar Putra, 81000 Kulai", hours: "8:00 AM - 5:00 PM", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80" },
  { name: "Dapur Jauhar", address: "Bandar Indahpura, 81000 Kulai", hours: "12:00 PM - 10:00 PM", image: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80" },
  { name: "Restoran Briyani Roket Kulai", address: "Jalan Kenanga 29/3, Bandar Indahpura, 81000 Kulai", hours: "11:00 AM - 9:00 PM", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80" },
  { name: "Ali Mamak Bistro by Restoran A&J Yoosoof", address: "240, Jalan Kenanga 29/2, Bandar Indahpura, 81000 Kulai", hours: "24 Hours", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80" },
  { name: "Auntie Anne's @ Aeon Kulai", address: "Lot G42, AEON Mall Kulaijaya, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1522244451342-a41bf8a13d73?auto=format&fit=crop&q=80" },
  { name: "Coolblog (添加所有分行)", address: "AEON Kulai / IOI Mall Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1558857563-b371032b4bf3?auto=format&fit=crop&q=80" },
  { name: "Adicto Churros Bandar Putra", address: "Bandar Putra, 81000 Kulai", hours: "2:00 PM - 11:00 PM", image: "https://images.unsplash.com/photo-1624371414361-e670ead0185e?auto=format&fit=crop&q=80" },
  { name: "Ayam Gepuk 143", address: "Jalan Susur Kulai, 81000 Kulai", hours: "11:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1626804475297-41609ea004be?auto=format&fit=crop&q=80" },
  { name: "Meet U Kulai Bubble Tea", address: "Jalan Kenanga 29/1, Bandar Indahpura", hours: "11:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1558857563-b371032b4bf3?auto=format&fit=crop&q=80" },
  { name: "Cocotown The Commune Mall", address: "The Commune Lifestyle Mall, Persiaran Indahpura Utama, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80" },
  { name: "Jing Xin Vegetarian Cuisine (净心素食)", address: "Taman Pancasila, 81000 Kulai", hours: "8:00 AM - 4:00 PM", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80" },
  { name: "Restoran Lim Lai Kee (林来记)", address: "Kampung Baru Kelapa Sawit, 81030 Kulai", hours: "4:00 PM - 10:30 PM", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80" },
  { name: "Sang Gerai IOI Mall Kulai", address: "Lot G41B, Ground Floor, IOI Mall Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80" },
  { name: "Kenangan Coffee THE COMMUNE", address: "The Commune Lifestyle Mall, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80" },
  { name: "Jia Yi (呷姨)", address: "Bandar Putra, 81000 Kulai", hours: "8:00 AM - 5:00 PM", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80" },
  { name: "Yogurt Yoogoo - Kulai", address: "Bandar Indahpura, 81000 Kulai", hours: "11:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1574158622564-8ab3e4c49d44?auto=format&fit=crop&q=80" },
  { name: "ChaTraMue - IOI Mall Kulai", address: "IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1558857563-b371032b4bf3?auto=format&fit=crop&q=80" },
  { name: "BINGXUE Bandar Indahpura Kulai", address: "Bandar Indahpura, 81000 Kulai", hours: "10:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1558857563-b371032b4bf3?auto=format&fit=crop&q=80" },
  { name: "D Laksa (添加所有相关分行)", address: "AEON Kulai / IOI Mall Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80" },
  { name: "Restoran Prata Maju", address: "Bandar Indahpura, 81000 Kulai", hours: "7:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80" },
  { name: "The Bretzel Co Aeon Kulai", address: "AEON Mall Kulaijaya, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1615568164347-196191c784dd?auto=format&fit=crop&q=80" },
  { name: "RESTORAN SHARAFATH (Branch 2)", address: "Taman Anggerik, 81000 Kulai", hours: "24 Hours", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80" },
  { name: "Restoran D' Serambi", address: "Bandar Putra, 81000 Kulai", hours: "11:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80" },
  { name: "llaollao 所有分行", address: "AEON Kulai / IOI Mall Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1574158622564-8ab3e4c49d44?auto=format&fit=crop&q=80" },
  { name: "NSH INDIAN FOOD ENTERPRISE", address: "Kulai, Johor", hours: "8:00 AM - 9:00 PM", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80" },
  { name: "Nasi Kukus Gulai Padang", address: "Taman Tropika, 81000 Kulai", hours: "11:00 AM - 9:00 PM", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80" },
  { name: "Coffee Over Chaos", address: "Bandar Indahpura, 81000 Kulai", hours: "9:00 AM - 6:00 PM", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80" },
  { name: "GC Good Coffee (Kulai)", address: "Jalan Kenanga 29/1, Bandar Indahpura, 81000 Kulai", hours: "8:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80" },
  { name: "Mutiara Garden Restaurant", address: "Jalan Kenari, Bandar Putra, 81000 Kulai", hours: "11:00 AM - 2:30 PM, 5:30 PM - 10:00 PM", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80" },
  { name: "TakoBeef Takoyaki", address: "Kulai, Johor", hours: "12:00 PM - 9:00 PM", image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80" },
  { name: "Hot & Roll • IOI Mall Kulai", address: "Ground Floor, IOI Mall Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80" },
  { name: "Cocotown The Commune Mall (Branch 2/Alternative)", address: "The Commune Lifestyle Mall, 81000 Kulai", hours: "10:00 AM - 10:00 PM", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80" },
  { name: "Rawon Signature", address: "Kulai, Johor", hours: "11:00 AM - 9:00 PM", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80" },
  { name: "Casual Coffee 休闲咖啡", address: "Bandar Indahpura, 81000 Kulai", hours: "11:00 AM - 11:00 PM", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80" }
];

async function run() {
  console.log(`Starting to update records...`);
  
  // Find them and update
  const { data: records, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, name, extra_details')
    .in('name', updates.map(u => u.name));
    
  if (fetchErr) {
    console.error("Fetch DB Error:", fetchErr);
    return;
  }
  
  console.log(`Found ${records.length} records matching the inserted names.`);
  
  for (const record of records) {
      const match = updates.find(u => u.name === record.name);
      if (match) {
          const newExt = {
              ...(record.extra_details || {}),
              address: match.address,
              opening_hours: match.hours,
              image_url: match.image
          };
          
          const { error } = await supabase
            .from('restaurants')
            .update({ 
                hot_score: 0, 
                address: match.address, 
                image_url: match.image,
                extra_details: newExt
            })
            .eq('id', record.id);
            
         if (error) {
             console.error(`Error updating ${record.name}:`, error.message);
         } else {
             console.log(`✅ Updated ${record.name} (hot_score = 0, fine-tuned address, photo, hours)`);
         }
      }
  }
}

run();
