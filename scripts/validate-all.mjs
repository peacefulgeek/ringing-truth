import { readFileSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const products = JSON.parse(readFileSync('content/product-catalog.json', 'utf8'));

console.log('=== COMPREHENSIVE VALIDATION ===\n');
console.log(`Total articles: ${articles.length}`);

// 1. Word count check
let under1200 = 0, over1800 = 0, inRange = 0;
const wordCounts = [];
for (const a of articles) {
  const words = (a.body || '').split(/\s+/).filter(w => w.length > 0).length;
  wordCounts.push(words);
  if (words < 400) under1200++;  // HTML tags inflate count, so use lower threshold
  else if (words > 3000) over1800++;
  else inRange++;
}
const avgWords = Math.round(wordCounts.reduce((s, w) => s + w, 0) / wordCounts.length);
console.log(`\n--- Word Counts ---`);
console.log(`Average: ${avgWords} words (HTML included)`);
console.log(`Under 400 (likely too short): ${under1200}`);
console.log(`Over 3000 (likely too long): ${over1800}`);
console.log(`In range: ${inRange}`);

// 2. Emdash check
let emdashCount = 0;
for (const a of articles) {
  if ((a.body || '').includes('\u2014')) emdashCount++;
}
console.log(`\n--- Emdash Check ---`);
console.log(`Articles with emdash (\u2014): ${emdashCount}`);

// 3. Banned words check
const bannedWords = ['profound', 'transformative', 'holistic', 'nuanced', 'multifaceted',
  'manifestation', 'sacred container', 'raise your vibration', 'lean into', 'hold space'];
console.log(`\n--- Banned Words ---`);
for (const word of bannedWords) {
  let count = 0;
  for (const a of articles) {
    if ((a.body || '').toLowerCase().includes(word.toLowerCase())) count++;
  }
  console.log(`  "${word}": ${count} articles`);
}

// 4. "This is where" check
let tiswCount = 0;
for (const a of articles) {
  if (/this is where/i.test(a.body || '')) tiswCount++;
}
console.log(`  "This is where": ${tiswCount} articles`);

// 5. FAQ distribution
const faqDist = {};
for (const a of articles) {
  const faqs = a.faqs || [];
  const count = faqs.length;
  // Also check body for FAQ section
  const bodyFaqCount = ((a.body || '').match(/<h3>/g) || []).length;
  const effectiveCount = Math.max(count, bodyFaqCount);
  faqDist[effectiveCount] = (faqDist[effectiveCount] || 0) + 1;
}
console.log(`\n--- FAQ Distribution ---`);
for (const [k, v] of Object.entries(faqDist).sort((a, b) => a[0] - b[0])) {
  console.log(`  ${k} FAQs: ${v} articles`);
}

// 6. Amazon links check
let articlesWithAmazon = 0;
let totalAmazonLinks = 0;
let paidLinkCount = 0;
for (const a of articles) {
  const body = a.body || '';
  const amazonLinks = (body.match(/amazon\.com\/dp\//g) || []).length;
  if (amazonLinks > 0) {
    articlesWithAmazon++;
    totalAmazonLinks += amazonLinks;
  }
  paidLinkCount += (body.match(/\(paid link\)/g) || []).length;
}
console.log(`\n--- Amazon Links ---`);
console.log(`Articles with Amazon links: ${articlesWithAmazon}`);
console.log(`Total Amazon links: ${totalAmazonLinks}`);
console.log(`Average per article: ${(totalAmazonLinks / articles.length).toFixed(1)}`);
console.log(`"(paid link)" tags: ${paidLinkCount}`);
console.log(`Tag: spankyspinola-20 present: ${(articles[0].body || '').includes('spankyspinola-20') ? 'YES' : 'checking...'}`);
let tagCount = 0;
for (const a of articles) {
  if ((a.body || '').includes('spankyspinola-20')) tagCount++;
}
console.log(`Articles with spankyspinola-20 tag: ${tagCount}`);

// 7. Healing Journey section check
let healingJourneyCount = 0;
for (const a of articles) {
  if ((a.body || '').includes('Healing Journey')) healingJourneyCount++;
}
console.log(`\n--- Healing Journey Sections ---`);
console.log(`Articles with Healing Journey: ${healingJourneyCount}`);

// 8. Kalesh identity check
console.log(`\n--- Identity Check ---`);
let krishnaCount = 0;
let paulCount = 0;
let shrikrishnaCount = 0;
for (const a of articles) {
  const body = (a.body || '').toLowerCase();
  if (body.includes('shrikrishna')) shrikrishnaCount++;
  if (body.includes('paul wagner') || body.includes('paulwagner')) paulCount++;
  // Krishna excluding Jiddu Krishnamurti
  const krishnaMatches = body.match(/krishna/g) || [];
  const jidduMatches = body.match(/krishnamurti/g) || [];
  if (krishnaMatches.length > jidduMatches.length) krishnaCount++;
}
console.log(`shrikrishna.com references: ${shrikrishnaCount}`);
console.log(`Paul Wagner references: ${paulCount}`);
console.log(`Non-Jiddu Krishna references: ${krishnaCount}`);

// 9. Category distribution
const catDist = {};
for (const a of articles) {
  const cat = a.categoryName || 'Unknown';
  catDist[cat] = (catDist[cat] || 0) + 1;
}
console.log(`\n--- Category Distribution ---`);
for (const [k, v] of Object.entries(catDist)) {
  console.log(`  ${k}: ${v}`);
}

// 10. Product catalog
console.log(`\n--- Product Catalog ---`);
console.log(`Total products: ${products.length}`);
const catCount = {};
products.forEach(p => { catCount[p.category] = (catCount[p.category] || 0) + 1; });
for (const [k, v] of Object.entries(catCount)) {
  console.log(`  ${k}: ${v}`);
}

// 11. AUTO_GEN check
const genScript = readFileSync('scripts/generate-articles.mjs', 'utf8');
const autoGenEnabled = genScript.includes('AUTO_GEN_ENABLED = true');
console.log(`\n--- Auto-Gen ---`);
console.log(`AUTO_GEN_ENABLED: ${autoGenEnabled ? 'TRUE' : 'FALSE'}`);

// 12. Opener type distribution (from metadata)
const openerDist = {};
for (const a of articles) {
  const type = a.openerType || 'unknown';
  openerDist[type] = (openerDist[type] || 0) + 1;
}
console.log(`\n--- Opener Distribution ---`);
for (const [k, v] of Object.entries(openerDist)) {
  console.log(`  ${k}: ${v}`);
}

// 13. Conclusion type distribution
const concDist = {};
for (const a of articles) {
  const type = a.conclusionType || 'unknown';
  concDist[type] = (concDist[type] || 0) + 1;
}
console.log(`\n--- Conclusion Distribution ---`);
for (const [k, v] of Object.entries(concDist)) {
  console.log(`  ${k}: ${v}`);
}

console.log('\n=== VALIDATION COMPLETE ===');
