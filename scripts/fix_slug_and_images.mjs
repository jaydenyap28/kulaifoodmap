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
const targetNames = [
  "Ayam Gepuk Express", "Restoran Nyonya V", "Restoran Selera Lagenda", "Burger King", 
  "Beriani Warisan Ibu", "Dah Order Ke?", "Restoran Nasi Ayam Berempah Kak Hani", 
  "Pop Meals - IOI Mall Kulai", "Warung Bakso Bandar Kulai", "A&W IOI Mall Kulai DT", 
  "Pisang cheese coklat padu", "Richeese Factory The Commune Indahpura", "JCO Donut & Coffee", 
  "RESTORAN SHARAFATH", "Kopilicious Kulai", "Dapur Jauhar", "Restoran Briyani Roket Kulai", 
  "Ali Mamak Bistro by Restoran A&J Yoosoof", "Auntie Anne's @ Aeon Kulai", "Coolblog (添加所有分行)", 
  "Adicto Churros Bandar Putra", "Ayam Gepuk 143", "Meet U Kulai Bubble Tea", 
  "Cocotown The Commune Mall", "Jing Xin Vegetarian Cuisine (净心素食)", "Restoran Lim Lai Kee (林来记)", 
  "Sang Gerai IOI Mall Kulai", "Kenangan Coffee THE COMMUNE", "Jia Yi (呷姨)", 
  "Yogurt Yoogoo - Kulai", "ChaTraMue - IOI Mall Kulai", "BINGXUE Bandar Indahpura Kulai", 
  "D Laksa (添加所有相关分行)", "Restoran Prata Maju", "The Bretzel Co Aeon Kulai", 
  "RESTORAN SHARAFATH (Branch 2)", "Restoran D' Serambi", "llaollao 所有分行", 
  "NSH INDIAN FOOD ENTERPRISE", "Nasi Kukus Gulai Padang", "Coffee Over Chaos", 
  "GC Good Coffee (Kulai)", "Mutiara Garden Restaurant", "TakoBeef Takoyaki", 
  "Hot & Roll • IOI Mall Kulai", "Cocotown The Commune Mall (Branch 2/Alternative)", 
  "Rawon Signature", "Casual Coffee 休闲咖啡"
];

function generateSlug(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // swap spaces to hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

async function scrapeShopeeImage(url) {
    if (!url || !url.includes('shopee.com.my')) return null;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
            redirect: 'follow'
        });
        const html = await res.text();
        const imageUrlMatch = html.match(/og:image"\s+content="([^"]+)"/i) || html.match(/image_src"\s+href="([^"]+)"/i);
        return imageUrlMatch ? imageUrlMatch[1] : null;
    } catch (e) {
        return null;
    }
}

async function run() {
  console.log(`Starting to scrape images and inject slugs for the 48 merchants...`);
  
  const { data: records, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, name, image_url, extra_details')
    .in('name', targetNames);
    
  if (fetchErr) {
    console.error("Fetch DB Error:", fetchErr);
    return;
  }
  
  for (const record of records) {
      let ext = record.extra_details || {};
      let shopeeLink = ext.delivery_link || '';
      
      let realImg = null;
      if (shopeeLink) {
          realImg = await scrapeShopeeImage(shopeeLink);
      }
      
      let slug = ext.slug;
      if (!slug) {
         // Create a unique slug using ID
         slug = generateSlug(record.name) + '-' + record.id;
      }
      
      // Update object
      const updates = {};
      let extChanged = false;
      
      if (ext.slug !== slug) {
          ext.slug = slug;
          extChanged = true;
      }
      
      if (realImg && ext.image !== realImg) {
          updates.image_url = realImg;
          ext.image = realImg;
          extChanged = true;
      }
      
      if (extChanged) {
          updates.extra_details = ext;
      }
      
      if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from('restaurants').update(updates).eq('id', record.id);
          if (error) {
              console.error(`Error updating ${record.name}:`, error.message);
          } else {
              console.log(`✅ Fixed [${record.name}] -> Slug: ${slug}, Img: ${realImg ? 'Scraped' : 'Retained'}`);
          }
      } else {
          console.log(`No changes needed for ${record.name}`);
      }
  }
  console.log('Complete!');
}

run();
