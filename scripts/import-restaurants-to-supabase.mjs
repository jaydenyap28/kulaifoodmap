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

  // We remove hot_score from chunk to not overwrite anything
  const safeChunk = chunk.map(r => {
    const copy = { ...r };
    delete copy.hot_score;
    return copy;
  });

  const { error } = await supabase
    .from('restaurants')
    .upsert(safeChunk, { onConflict: 'source_restaurant_id', ignoreDuplicates: true });

  if (error) {
    throw error;
  }

  console.log(`Imported ${Math.min(index + chunkSize, rows.length)} / ${rows.length}`);
}

console.log('Restaurant import completed.');
