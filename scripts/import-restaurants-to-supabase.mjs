import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const sourcePath = path.resolve('src/data/restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const rows = restaurants.map((restaurant) => ({
  source_restaurant_id: restaurant.id ?? null,
  name: restaurant.name_en || restaurant.name || 'Unknown Restaurant',
  category: Array.isArray(restaurant.categories)
    ? restaurant.categories.join(' | ')
    : Array.isArray(restaurant.category)
      ? restaurant.category.join(' | ')
      : null,
  address: restaurant.address || null,
  image_url: restaurant.image || null,
  hot_score: 0,
}));

const chunkSize = 100;

for (let index = 0; index < rows.length; index += chunkSize) {
  const chunk = rows.slice(index, index + chunkSize);

  const { error } = await supabase
    .from('restaurants')
    .upsert(chunk, { onConflict: 'source_restaurant_id' });

  if (error) {
    throw error;
  }

  console.log(`Imported ${Math.min(index + chunkSize, rows.length)} / ${rows.length}`);
}

console.log('Restaurant import completed.');
