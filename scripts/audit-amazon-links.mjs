import { readFileSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));

let under3 = 0;
let exactly3 = 0;
let over3 = 0;
const shortfalls = [];
const distribution = {};

for (const a of articles) {
  const body = a.body || '';
  
  // Count ALL amazon links in the body
  const allAmazonLinks = (body.match(/amazon\.com\/dp\/[A-Z0-9]+\?tag=spankyspinola-20/g) || []);
  const totalCount = allAmazonLinks.length;
  
  // Count links ONLY in the Healing Journey section
  const healingIdx = body.indexOf('Healing Journey');
  let healingLinks = 0;
  if (healingIdx > 0) {
    const healingSection = body.substring(healingIdx);
    healingLinks = (healingSection.match(/amazon\.com\/dp\/[A-Z0-9]+\?tag=spankyspinola-20/g) || []).length;
  }
  
  // Inline links = total minus healing journey section links
  const inlineLinks = totalCount - healingLinks;
  
  distribution[totalCount] = (distribution[totalCount] || 0) + 1;
  
  if (totalCount < 3) {
    under3++;
    shortfalls.push({ id: a.id, title: a.title, category: a.categoryName, total: totalCount, inline: inlineLinks, healing: healingLinks });
  } else if (totalCount === 3) {
    exactly3++;
  } else {
    over3++;
  }
}

console.log('=== AMAZON LINK AUDIT ===');
console.log(`Total articles: ${articles.length}`);
console.log(`Under 3 total Amazon links: ${under3}`);
console.log(`Exactly 3: ${exactly3}`);
console.log(`Over 3: ${over3}`);
console.log(`\nDistribution (total links per article):`);
for (const [count, num] of Object.entries(distribution).sort((a,b) => Number(a[0]) - Number(b[0]))) {
  console.log(`  ${count} links: ${num} articles`);
}

if (shortfalls.length > 0) {
  console.log(`\n--- Articles needing more links (${shortfalls.length}) ---`);
  for (const s of shortfalls.slice(0, 20)) {
    console.log(`  ID ${s.id}: "${s.title}" [${s.category}] - total: ${s.total}, inline: ${s.inline}, healing: ${s.healing}`);
  }
  if (shortfalls.length > 20) {
    console.log(`  ... and ${shortfalls.length - 20} more`);
  }
}
