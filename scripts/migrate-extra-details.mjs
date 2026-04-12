import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// try to read from .env.local if available
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
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const sourcePath = path.resolve('src/data/restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const DB_COLUMNS = [
  'id', 'source_restaurant_id', 'name', 'category', 'address', 'image_url',
  'hot_score', 'is_featured', 'is_active', 'is_hidden', 'sort_priority',
  'badge_label', 'ad_label', 'affiliate_url', 'updated_at'
];

async function migrate() {
    console.log(`Starting migration for ${restaurants.length} restaurants...`);
    
    // Fetch all current from supabase
    const { data: dbRows, error: fetchErr } = await supabase.from('restaurants').select('*');
    if (fetchErr) throw fetchErr;

    console.log(`Found ${dbRows.length} existing rows in Supabase.`);

    let updatedCount = 0;

    for (const jsonRest of restaurants) {
        // Find matching row (by source_restaurant_id or id if not set)
        const row = dbRows.find(r => r.source_restaurant_id === jsonRest.id || r.id === jsonRest.id);
        
        if (!row) {
            console.log(`Skipping JSON id ${jsonRest.id}: no matching row found in Supabase.`);
            continue;
        }

        // Build Payload
        const payload = {
            name: jsonRest.name || jsonRest.desc || 'Unknown Name',
            address: jsonRest.address || null,
            category: Array.isArray(jsonRest.categories) ? jsonRest.categories.join(' | ') : 
                      (Array.isArray(jsonRest.category) ? jsonRest.category.join(' | ') : jsonRest.category || null),
            image_url: jsonRest.image || jsonRest.image_url || null,
            affiliate_url: jsonRest.affiliate_url || row.affiliate_url || null,
        };

        const extra_details = {};
        for (const key in jsonRest) {
            if (!DB_COLUMNS.includes(key)) {
                extra_details[key] = jsonRest[key];
            }
        }
        
        // Preserve any properties already in extra_details in DB if not in JSON (optional, but json is source of truth here)
        payload.extra_details = {
            ...(row.extra_details || {}),
            ...extra_details
        };

        const { error: upErr } = await supabase.from('restaurants').update(payload).eq('id', row.id);
        if (upErr) {
            console.error(`Failed to update ${row.id}`, upErr);
        } else {
            updatedCount++;
        }
    }

    console.log(`Migration complete! Successfully fully restored ${updatedCount} restaurants into Supabase.`);
}

migrate();
