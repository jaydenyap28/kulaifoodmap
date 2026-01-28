
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialRestaurants } from './src/data/restaurants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manualSlugs = {
    '秀花菜粄': 'xiu-hua-cai-ban',
    '莲姨鼎边糊': 'lian-yi-ding-bian-hu',
    '乡村咖啡馆': 'xiang-cun-cafe',
    '桃源饭店': 'tao-yuan-restaurant',
    '财记点心': 'cai-ji-dim-sum'
};

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/['&@!]/g, '') // Remove specific special chars first
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric (except space and hyphen)
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-'); // Replace multiple - with single -
};

const slugs = new Set();
const updatedRestaurants = initialRestaurants.map(r => {
    let source = r.name_en;
    
    if (!source) {
        // Fallback to name, but check if it's in manual list first
        if (manualSlugs[r.name]) {
            source = manualSlugs[r.name];
        } else {
            source = r.name;
        }
    }

    let slug = slugify(source);
    
    // Fallback if slug became empty (e.g. pure chinese name not in manual list)
    if (!slug) {
        console.warn(`Warning: Empty slug generated for ID ${r.id} (${r.name}). Using fallback.`);
        slug = `restaurant-${r.id}`;
    }

    // Uniqueness
    let originalSlug = slug;
    let counter = 1;
    while (slugs.has(slug)) {
        slug = `${originalSlug}-${counter}`;
        counter++;
    }
    slugs.add(slug);

    return {
        ...r,
        slug
    };
});

const content = `export const initialRestaurants = ${JSON.stringify(updatedRestaurants, null, 4)};`;
fs.writeFileSync('./src/data/restaurants.js', content, 'utf8');
console.log(`Successfully updated restaurants.js with slugs! Total: ${updatedRestaurants.length}`);
