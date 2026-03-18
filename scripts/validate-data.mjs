import { initialRestaurants } from '../src/data/restaurants.js';

const issues = [];
const warnings = [];

const seenIds = new Map();
const seenSlugs = new Map();
const seenNameAddr = new Map();

const allowedHalal = new Set(['non_halal', 'certified', 'muslim_owned', 'no_pork', 'pork_free', null, undefined, '']);

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
};

const hasBadChar = (s) => typeof s === 'string' && s.includes('�');

for (const r of initialRestaurants) {
  const ctx = `id=${r.id} name=${r.name || '(empty)'}`;

  // Required fields
  if (!r.id && r.id !== 0) issues.push(`${ctx} 缺少 id`);
  if (!r.name) issues.push(`${ctx} 缺少 name`);
  if (!r.address) issues.push(`${ctx} 缺少 address`);
  if (!r.slug) issues.push(`${ctx} 缺少 slug`);
  if (!Array.isArray(r.categories) || r.categories.length === 0) warnings.push(`${ctx} categories 为空`);

  // Duplicate checks
  if (seenIds.has(r.id)) issues.push(`${ctx} 与 id=${seenIds.get(r.id)} 重复 id`);
  else seenIds.set(r.id, r.name || 'unknown');

  if (r.slug) {
    if (seenSlugs.has(r.slug)) issues.push(`${ctx} 与 id=${seenSlugs.get(r.slug)} 重复 slug=${r.slug}`);
    else seenSlugs.set(r.slug, r.id);
  }

  const key = `${(r.name || '').trim()}|${(r.address || '').trim()}`;
  if (seenNameAddr.has(key)) warnings.push(`${ctx} 与 id=${seenNameAddr.get(key)} 名称+地址重复`);
  else seenNameAddr.set(key, r.id);

  // Halal
  if (!allowedHalal.has(r.halalStatus)) issues.push(`${ctx} halalStatus 非法值: ${r.halalStatus}`);

  // URL fields
  for (const f of ['image', 'menu_link', 'website_link', 'delivery_link', 'whatsappLink', 'fb_post_link']) {
    if (!isValidUrl(r[f])) warnings.push(`${ctx} 字段 ${f} URL 可能无效: ${r[f]}`);
  }

  // ImgBB 页面链接不可直接展示图片，建议改用 i.ibb.co 直链
  if (typeof r.image === 'string' && r.image.includes('ibb.co/') && !r.image.includes('i.ibb.co/')) {
    warnings.push(`${ctx} image 使用了 ibb 页面链接，建议改成 i.ibb.co 直链: ${r.image}`);
  }

  // Coordinates
  if (r.location && (r.location.lat || r.location.lng)) {
    const lat = Number(r.location.lat);
    const lng = Number(r.location.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      warnings.push(`${ctx} location 非数字 lat/lng: ${JSON.stringify(r.location)}`);
    } else {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        issues.push(`${ctx} location 越界: ${JSON.stringify(r.location)}`);
      }
      // Malaysia rough bounds
      if (lat < 0.5 || lat > 7.8 || lng < 99 || lng > 120) {
        warnings.push(`${ctx} location 看起来不在马来西亚范围: ${JSON.stringify(r.location)}`);
      }
    }
  }

  // Corrupted chars
  for (const f of ['name', 'name_en', 'intro_zh', 'intro_en', 'address', 'opening_hours']) {
    if (hasBadChar(r[f])) warnings.push(`${ctx} 字段 ${f} 含乱码字符 �`);
  }
}

const result = {
  total: initialRestaurants.length,
  issueCount: issues.length,
  warningCount: warnings.length,
  issues: issues.slice(0, 80),
  warnings: warnings.slice(0, 120)
};

console.log(JSON.stringify(result, null, 2));

if (issues.length > 0) {
  process.exitCode = 1;
}
