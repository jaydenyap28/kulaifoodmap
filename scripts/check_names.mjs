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

async function fixNames() {
    // We update by their IDs or by string match.
    // D Laksa
    let dlaksaData = await supabase.from('restaurants').select('*').ilike('name', 'D Laksa%');
    for (let r of dlaksaData.data) {
        let ext = r.extra_details;
        ext.name = 'D Laksa';
        ext.branches = [{name: 'AEON Mall Kulaijaya', address: ''}, {name: 'IOI Mall Kulai', address: ''}];
        await supabase.from('restaurants').update({name: 'D Laksa', extra_details: ext}).eq('id', r.id);
        console.log(`Updated ${r.id} to D Laksa`);
    }

    // Coolblog
    let coolblogData = await supabase.from('restaurants').select('*').ilike('name', 'Coolblog%');
    for (let r of coolblogData.data) {
        let ext = r.extra_details;
        ext.name = 'Coolblog';
        ext.branches = [{name: 'AEON Mall Kulaijaya', address: ''}, {name: 'IOI Mall Kulai', address: ''}, {name: 'Bandar Putra', address: ''}];
        await supabase.from('restaurants').update({name: 'Coolblog', extra_details: ext}).eq('id', r.id);
        console.log(`Updated ${r.id} to Coolblog`);
    }

    // llaollao
    let lData = await supabase.from('restaurants').select('*').ilike('name', 'llaollao%');
    for (let r of lData.data) {
        let ext = r.extra_details;
        ext.name = 'llaollao';
        ext.branches = [{name: 'AEON Mall Kulaijaya', address: ''}, {name: 'IOI Mall Kulai', address: ''}];
        await supabase.from('restaurants').update({name: 'llaollao', extra_details: ext}).eq('id', r.id);
        console.log(`Updated ${r.id} to llaollao`);
    }

    // Cocotown (Branch 2/Alternative) -> rename to Cocotown (Drink Kiosk) or similar to differentiate.
    let cData = await supabase.from('restaurants').select('*').ilike('name', 'Cocotown%Branch 2%');
    for (let r of cData.data) {
        let ext = r.extra_details;
        ext.name = 'Cocotown Kiosk @ The Commune';
        await supabase.from('restaurants').update({name: 'Cocotown Kiosk @ The Commune', extra_details: ext}).eq('id', r.id);
        console.log(`Updated ${r.id} to Cocotown Kiosk @ The Commune`);
    }

    // RESTORAN SHARAFATH (Branch 2)
    let sData = await supabase.from('restaurants').select('*').ilike('name', 'RESTORAN SHARAFATH%Branch 2%');
    for (let r of sData.data) {
        let ext = r.extra_details;
        ext.name = 'Restoran Sharafath (Taman Anggerik)';
        await supabase.from('restaurants').update({name: 'Restoran Sharafath (Taman Anggerik)', extra_details: ext}).eq('id', r.id);
        console.log(`Updated ${r.id} to Restoran Sharafath (Taman Anggerik)`);
    }
}

fixNames();
