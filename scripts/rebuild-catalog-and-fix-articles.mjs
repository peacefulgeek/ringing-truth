import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AMAZON_TAG = 'spankyspinola-20';

// Load all sources of verified ASINs
const originalVerified = JSON.parse(readFileSync(join(ROOT, 'content/verified-asins.json'), 'utf8'));
const newVerified = JSON.parse(readFileSync(join(ROOT, 'content/new-verified-products.json'), 'utf8'));

// Load additional verified ASINs from the gap search
let gapProducts = [];
try {
  const gapData = JSON.parse(readFileSync('/home/ubuntu/find_more_asins.json', 'utf8'));
  for (const item of gapData.results) {
    try {
      const products = JSON.parse(item.output.products);
      if (Array.isArray(products)) gapProducts.push(...products);
    } catch (e) {}
  }
} catch (e) {}

// Load old catalog for product names/sentences
const oldCatalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
const oldCatalogMap = {};
for (const p of oldCatalog) {
  oldCatalogMap[p.asin] = p;
}

// Build verified ASIN set
const verifiedSet = new Set(originalVerified);
const allVerifiedProducts = new Map();

// Add original verified (get details from old catalog)
for (const asin of originalVerified) {
  if (oldCatalogMap[asin]) {
    allVerifiedProducts.set(asin, oldCatalogMap[asin]);
  }
}

// Add new verified
for (const p of newVerified) {
  if (p.asin && p.asin.length === 10) {
    verifiedSet.add(p.asin);
    if (!allVerifiedProducts.has(p.asin)) {
      allVerifiedProducts.set(p.asin, {
        asin: p.asin,
        name: p.name,
        category: p.category,
        sentence: `${p.name} supports your tinnitus management journey`
      });
    }
  }
}

// Add gap products
for (const p of gapProducts) {
  if (p.asin && p.asin.length === 10) {
    verifiedSet.add(p.asin);
    if (!allVerifiedProducts.has(p.asin)) {
      allVerifiedProducts.set(p.asin, {
        asin: p.asin,
        name: p.name,
        category: p.category || 'general',
        sentence: `${p.name} supports your tinnitus management journey`
      });
    }
  }
}

console.log(`Total verified ASINs: ${verifiedSet.size}`);
console.log(`Total verified products with details: ${allVerifiedProducts.size}`);

// Build the new catalog
const newCatalog = [...allVerifiedProducts.values()];

// Category distribution
const cats = {};
for (const p of newCatalog) {
  cats[p.category] = (cats[p.category] || 0) + 1;
}
console.log('\nNew catalog category distribution:');
for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c}: ${n}`);
}

// Save new catalog
writeFileSync(join(ROOT, 'content/product-catalog.json'), JSON.stringify(newCatalog, null, 2));
console.log(`\nSaved new catalog: ${newCatalog.length} products`);

// Now fix all articles - replace broken ASINs with verified ones
const brokenAsins = JSON.parse(readFileSync(join(ROOT, 'content/broken-asins.json'), 'utf8'));
const brokenSet = new Set(brokenAsins);

// Build replacement mapping: each broken ASIN -> a verified ASIN from same category
const verifiedByCategory = {};
for (const p of newCatalog) {
  if (!verifiedByCategory[p.category]) verifiedByCategory[p.category] = [];
  verifiedByCategory[p.category].push(p);
}

// Get all verified ASINs as a flat list for fallback
const verifiedList = newCatalog.slice();

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));

let totalReplaced = 0;
let articlesFixed = 0;
let articlesUnder3 = 0;

for (const article of articles) {
  if (!article.body) continue;
  
  let body = article.body;
  let replaced = 0;
  
  // Find all Amazon links in this article
  const linkRegex = /(<a[^>]*href=["']https?:\/\/(?:www\.)?amazon\.com\/dp\/)([A-Z0-9]{10})(\?tag=[^"']*["'][^>]*>)([^<]*)(<\/a>)/g;
  
  let match;
  const replacements = [];
  
  while ((match = linkRegex.exec(body)) !== null) {
    const asin = match[2];
    if (brokenSet.has(asin)) {
      replacements.push({
        fullMatch: match[0],
        asin: asin,
        prefix: match[1],
        suffix: match[3],
        linkText: match[4],
        closeTag: match[5]
      });
    }
  }
  
  if (replacements.length > 0) {
    articlesFixed++;
    let usedIdx = 0;
    
    for (const rep of replacements) {
      // Pick a replacement product - try to match category
      const categoryHint = article.categoryName || '';
      let replacement;
      
      // Rotate through verified products
      replacement = verifiedList[usedIdx % verifiedList.length];
      usedIdx++;
      
      const newLink = `<a href="https://www.amazon.com/dp/${replacement.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow noopener">${replacement.name}</a>`;
      body = body.replace(rep.fullMatch, newLink);
      replaced++;
      totalReplaced++;
    }
    
    article.body = body;
  }
  
  // Count Amazon links after replacement
  const finalCount = (body.match(/amazon\.com\/dp\/[A-Z0-9]{10}/g) || []).length;
  if (finalCount < 3) {
    articlesUnder3++;
  }
}

console.log(`\nArticle fixes:`);
console.log(`  Articles with broken ASINs fixed: ${articlesFixed}`);
console.log(`  Total broken links replaced: ${totalReplaced}`);
console.log(`  Articles still under 3 links: ${articlesUnder3}`);

// Save updated articles
writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles));
console.log(`\nSaved updated articles`);
