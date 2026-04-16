import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Extract from articles
const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const articleAsins = new Map(); // ASIN -> [article IDs]

for (const a of articles) {
  const body = a.body || '';
  const matches = body.matchAll(/amazon\.com\/dp\/([A-Z0-9]{10})/g);
  for (const m of matches) {
    const asin = m[1];
    if (!articleAsins.has(asin)) articleAsins.set(asin, []);
    articleAsins.get(asin).push(a.id);
  }
}

// Extract from product catalog
const catalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
const catalogAsins = new Set(catalog.map(p => p.asin));

// Combine all unique ASINs
const allAsins = new Set([...articleAsins.keys(), ...catalogAsins]);

console.log(`=== ASIN EXTRACTION ===`);
console.log(`Unique ASINs in articles: ${articleAsins.size}`);
console.log(`Unique ASINs in catalog: ${catalogAsins.size}`);
console.log(`Total unique ASINs: ${allAsins.size}`);
console.log(`ASINs in articles but not catalog: ${[...articleAsins.keys()].filter(a => !catalogAsins.has(a)).length}`);
console.log(`ASINs in catalog but not articles: ${[...catalogAsins].filter(a => !articleAsins.has(a)).length}`);

// Per-article link count
let under3 = 0;
for (const a of articles) {
  const body = a.body || '';
  const count = (body.match(/amazon\.com\/dp\/[A-Z0-9]{10}/g) || []).length;
  if (count < 3) under3++;
}
console.log(`Articles with < 3 Amazon links: ${under3}`);

// Save all ASINs for verification
const asinList = [...allAsins].sort();
writeFileSync(join(ROOT, 'content/asins-to-verify.json'), JSON.stringify(asinList, null, 2));
console.log(`\nSaved ${asinList.length} ASINs to content/asins-to-verify.json`);

// Also save the mapping for later replacement
const asinMap = {};
for (const [asin, ids] of articleAsins) {
  asinMap[asin] = { articleCount: ids.length, inCatalog: catalogAsins.has(asin) };
}
writeFileSync(join(ROOT, 'content/asin-usage-map.json'), JSON.stringify(asinMap, null, 2));
