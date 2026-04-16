import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
const catalogAsins = new Set(catalog.map(p => p.asin));

let under3 = 0;
let noTag = 0;
let noPaidLink = 0;
let notInCatalog = 0;
let totalLinks = 0;
const distribution = {};
const unknownAsins = new Set();

for (const a of articles) {
  const body = a.body || '';
  
  // Count all Amazon links
  const allLinks = [...body.matchAll(/amazon\.com\/dp\/([A-Z0-9]{10})/g)];
  const count = allLinks.length;
  totalLinks += count;
  distribution[count] = (distribution[count] || 0) + 1;
  
  if (count < 3) {
    under3++;
    console.log(`  UNDER 3: Article ${a.id} "${a.title}" has ${count} links`);
  }
  
  // Check each link has the tag
  const tagLinks = [...body.matchAll(/amazon\.com\/dp\/[A-Z0-9]{10}\?tag=spankyspinola-20/g)];
  if (tagLinks.length < allLinks.length) {
    noTag++;
  }
  
  // Check paid link labels
  const paidLinkCount = (body.match(/\(paid link\)/g) || []).length;
  if (paidLinkCount < count) {
    noPaidLink++;
  }
  
  // Check ASINs are in catalog
  for (const m of allLinks) {
    if (!catalogAsins.has(m[1])) {
      unknownAsins.add(m[1]);
      notInCatalog++;
    }
  }
}

console.log(`\n=== FINAL AUDIT ===`);
console.log(`Total articles: ${articles.length}`);
console.log(`Total Amazon links: ${totalLinks}`);
console.log(`Average links per article: ${(totalLinks / articles.length).toFixed(1)}`);
console.log(`\nArticles under 3 links: ${under3}`);
console.log(`Articles missing tag: ${noTag}`);
console.log(`Articles missing (paid link): ${noPaidLink}`);
console.log(`Links to ASINs not in catalog: ${notInCatalog}`);
console.log(`Unknown ASINs: ${unknownAsins.size}`);

if (unknownAsins.size > 0) {
  console.log(`  Unknown ASIN list: ${[...unknownAsins].join(', ')}`);
}

console.log(`\nLink distribution:`);
for (const [count, num] of Object.entries(distribution).sort((a, b) => Number(a) - Number(b))) {
  console.log(`  ${count} links: ${num} articles`);
}
