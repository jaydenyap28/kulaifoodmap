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

async function deleteDuplicates() {
  const { data: restaurants, error } = await supabase.from('restaurants').select('id, name').order('id', { ascending: false });
  if (error) {
    console.error('Error fetching restaurants', error);
    return;
  }

  const nameMap = new Map();
  const idsToDelete = [];

  for (const r of restaurants) {
    // Exact name match
    if (nameMap.has(r.name)) {
      idsToDelete.push(r.id);
    } else {
      nameMap.set(r.name, r.id);
    }
  }

  console.log(`Found ${idsToDelete.length} duplicate records. IDs to delete:`, idsToDelete);

  if (idsToDelete.length > 0) {
    // Since there might be constraints or just deleting in batches
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batchIds = idsToDelete.slice(i, i + 100);
      const { error: delError } = await supabase.from('restaurants').delete().in('id', batchIds);
      if (delError) {
        console.error('Failed to delete chunk:', delError);
      } else {
        console.log(`Deleted chunk of ${batchIds.length} records.`);
      }
    }
    console.log('Duplicate cleanup complete!');
  } else {
    console.log('No duplicates found.');
  }
}

deleteDuplicates();
