import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/data/restaurants.json');
const targetPath = path.resolve('tmp/restaurants-import.csv');

const restaurants = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const csvEscape = (value) => {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
};

const rows = restaurants.map((restaurant) => ({
  source_restaurant_id: restaurant.id ?? '',
  name: restaurant.name_en || restaurant.name || '',
  category: Array.isArray(restaurant.categories)
    ? restaurant.categories.join(' | ')
    : Array.isArray(restaurant.category)
      ? restaurant.category.join(' | ')
      : '',
  address: restaurant.address || '',
  image_url: restaurant.image || '',
  hot_score: 0,
}));

fs.mkdirSync(path.dirname(targetPath), { recursive: true });

const header = ['source_restaurant_id', 'name', 'category', 'address', 'image_url', 'hot_score'];
const csv = [
  header.join(','),
  ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(',')),
].join('\n');

fs.writeFileSync(targetPath, csv);

console.log(`Exported ${rows.length} restaurants to ${targetPath}`);
