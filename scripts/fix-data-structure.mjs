import fs from 'node:fs';
import path from 'node:path';
import { initialRestaurants } from '../src/data/restaurants.js';

const data = [...initialRestaurants];

// 1) 修复缺失 address
for (const r of data) {
  if (!r.address || !String(r.address).trim()) {
    r.address = '地址待补充 (Address TBD), Kulai, Johor';
  }
}

// 2) 修复空 categories（不改现有 category，只补 categories）
for (const r of data) {
  const hasCategories = Array.isArray(r.categories) && r.categories.length > 0;
  if (!hasCategories) {
    if (Array.isArray(r.category) && r.category.length > 0) {
      r.categories = [...r.category];
    } else {
      r.categories = ['其他'];
      r.category = Array.isArray(r.category) && r.category.length > 0 ? r.category : ['其他'];
    }
  }
}

// 3) 修复重复 slug
const slugCount = new Map();
for (const r of data) {
  const base = r.slug || 'restaurant';
  const count = slugCount.get(base) || 0;
  if (count === 0) {
    slugCount.set(base, 1);
  } else {
    const newSlug = `${base}-${count + 1}`;
    r.slug = newSlug;
    slugCount.set(base, count + 1);
  }
}

// 4) 修复重复 id（重复项分配新 id）
const seenIds = new Set();
let maxId = data.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
for (const r of data) {
  if (seenIds.has(r.id)) {
    maxId += 1;
    r.id = maxId;
  }
  seenIds.add(r.id);
}

// 写回 restaurants.js
const out = `export const initialRestaurants = ${JSON.stringify(data, null, 4)};\n`;
const file = path.resolve('D:/kulaifood/src/data/restaurants.js');
fs.writeFileSync(file, out, 'utf8');

console.log(`Fixed data written. Total: ${data.length}`);
