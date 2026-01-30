const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/restaurants.js');

const updates = [
  { name: 'Swiss Promise Bakery', image: 'https://i.ibb.co/S4fJjBFb/Swiss-Promise-Bakery.jpg' },
  { name: '唯美咖啡店', image: 'https://i.ibb.co/CpfX07cZ/image.jpg' },
  { name: '古来 21 里炒粿条', image: 'https://i.ibb.co/Dq7Zvnb/21.jpg' },
  { name: '长发咖啡店', image: 'https://i.ibb.co/3JHWq76/image.jpg' },
  { name: '新缤缤咖喱面', image: 'https://i.ibb.co/RrXFfQB/image.jpg' },
  { name: '川源咖啡店', image: 'https://i.ibb.co/p6K1KKjc/image.jpg' },
  { name: '忝兴美食阁', image: 'https://i.ibb.co/C5KLjZFz/image.jpg' },
  { name: 'Restoran Bach Viet Vietnamese Cuise', image: 'https://i.ibb.co/4g4yywn3/Restoran-Bach-Viet-Vietnamese-Cuise.jpg' },
  { name: '双福手工面粉粿', image: 'https://i.ibb.co/Z1z5Ssmw/image.jpg' },
  { name: '食尚·早点', image: 'https://i.ibb.co/39dN6sb4/image.jpg' },
  { name: 'Restoran Mustika Zam Zam', image: 'https://i.ibb.co/2065V9dm/Restoran-Mustika-Zam-Zam.jpg' },
  { name: 'De Selera Pantai Timur', image: 'https://i.ibb.co/1YmKBzjF/De-Selera-Pantai-Timur.jpg' },
  { name: 'Kulai Café', image: 'https://i.ibb.co/gZGv5ZX5/Kulai-Cafe.jpg' },
  { name: 'Restoran Puteri', image: 'https://i.ibb.co/hJD4qg7Q/Restoran-Puteri.jpg' },
  { name: '168美食坊', image: 'https://i.ibb.co/MKFZKM3/168.jpg' },
  { name: '乡园咖啡', image: 'https://i.ibb.co/GfDgrT4d/image.jpg' },
  { name: '科威咖啡餐室', image: 'https://i.ibb.co/SqLycr3/image.jpg' },
  { name: '老地方', image: 'https://i.ibb.co/WTVBK76/image.jpg' },
  { name: '梦幻茶餐室', image: 'https://i.ibb.co/Ng9QPJWv/image.jpg' },
  { name: '古来轩美食坊', image: 'https://i.ibb.co/WCj74Ls/image.jpg' },
];

function normalize(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function isMatch(r, q) {
  const n = normalize(r.name);
  const en = normalize(r.name_en || '');
  const qq = normalize(q);
  if (!qq) return false;
  if (n === qq || en === qq) return true;
  if (n.includes(qq) || en.includes(qq)) return true;
  // 特例：科威咖啡餐室/餐食
  if (qq.startsWith('科威咖啡') && n.startsWith('科威咖啡')) return true;
  // 特例：古来21里炒粿条（有无空格）
  if (qq.includes('古来21里炒粿条') && n.includes('古来21里炒粿条')) return true;
  // Kulai Cafe vs Kulai Café
  if (qq.includes('kulaicafe') && (n.includes('kulaicafe') || en.includes('kulaicafe'))) return true;
  return false;
}

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const initialRestaurants = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error('Could not find initialRestaurants array');
    process.exit(1);
  }
  const arrayStr = match[1];
  let restaurants;
  try {
    restaurants = new Function('return ' + arrayStr)();
  } catch (e) {
    console.error('Failed to parse restaurants array:', e);
    process.exit(1);
  }

  let updated = 0;
  const notFound = [];
  for (const u of updates) {
    let targets = restaurants.filter(r => isMatch(r, u.name));
    if (targets.length === 0) {
      notFound.push(u.name);
      continue;
    }
    // 如果找到多个，优先精确匹配
    const exact = targets.find(r => normalize(r.name) === normalize(u.name) || normalize(r.name_en || '') === normalize(u.name));
    const r = exact || targets[0];
    if (r.image !== u.image) {
      r.image = u.image;
      updated++;
    }
  }

  const newContent =
    'export const initialRestaurants = ' +
    JSON.stringify(restaurants, null, 4) +
    ';\n\nexport const MAIN_VIDEO_LINK = \'https://www.facebook.com/kulaifoodmap\';\n';

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Updated ${updated} images.`);
  if (notFound.length) {
    console.log('Not matched:', notFound.join(', '));
  }
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}
