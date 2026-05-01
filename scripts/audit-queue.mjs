// Audit all queued articles for word count, Amazon links, banned words, image assignment
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articlesPath = join(ROOT, 'content/all-articles.json');
const imageMapPath = join(ROOT, 'content/image-map.json');
const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
const imageMap = existsSync(imageMapPath) ? JSON.parse(readFileSync(imageMapPath, 'utf8')) : {};

const BANNED_WORDS = ['delve', 'tapestry', 'paradigm', 'synergy', 'leverage', 'unlock', 'empower', 'utilize', 'pivotal', 'embark', 'underscore', 'paramount', 'seamlessly', 'robust', 'beacon', 'foster', 'elevate', 'curate', 'curated', 'bespoke', 'resonate', 'harness', 'intricate', 'plethora', 'myriad', 'comprehensive', 'transformative', 'groundbreaking', 'innovative', 'cutting-edge', 'revolutionary', 'state-of-the-art', 'ever-evolving', 'profound', 'holistic', 'nuanced', 'multifaceted', 'stakeholders', 'ecosystem', 'furthermore', 'moreover', 'additionally', 'consequently', 'subsequently', 'thereby', 'streamline', 'optimize', 'facilitate', 'amplify', 'catalyze', 'landscape', 'framework'];

const queued = articles.filter(a => a.status === 'queued');
const published = articles.filter(a => a.status === 'published');

console.log(`Total articles: ${articles.length}`);
console.log(`Published: ${published.length}`);
console.log(`Queued: ${queued.length}`);
console.log('---');

let under1200 = [];
let under1800 = [];
let noAmazon = [];
let lessThan3Amazon = [];
let hasBannedWords = [];
let hasEmdash = [];
let noImage = [];
let wordCounts = [];

for (const article of queued) {
  const text = (article.body || '').replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  wordCounts.push(words);
  
  if (words < 1200) under1200.push({ id: article.id, slug: article.slug, words });
  if (words < 1800) under1800.push({ id: article.id, slug: article.slug, words });
  
  const amazonLinks = (article.body || '').match(/amazon\.com\/dp\//g) || [];
  if (amazonLinks.length === 0) noAmazon.push({ id: article.id, slug: article.slug });
  if (amazonLinks.length < 3) lessThan3Amazon.push({ id: article.id, slug: article.slug, count: amazonLinks.length });
  
  const bodyLower = (article.body || '').toLowerCase();
  const found = BANNED_WORDS.filter(w => bodyLower.includes(w.toLowerCase()));
  if (found.length > 0) hasBannedWords.push({ id: article.id, slug: article.slug, words: found });
  
  if (bodyLower.includes('\u2014') || bodyLower.includes('\u2013') || bodyLower.includes('&mdash;')) {
    hasEmdash.push({ id: article.id, slug: article.slug });
  }
  
  if (!imageMap[article.slug]) {
    noImage.push({ id: article.id, slug: article.slug });
  }
}

const avg = Math.round(wordCounts.reduce((s, w) => s + w, 0) / wordCounts.length);
const min = Math.min(...wordCounts);
const max = Math.max(...wordCounts);

console.log(`Word count stats: avg=${avg}, min=${min}, max=${max}`);
console.log(`Under 1200 words: ${under1200.length}`);
console.log(`Under 1800 words: ${under1800.length}`);
console.log(`No Amazon links: ${noAmazon.length}`);
console.log(`Less than 3 Amazon links: ${lessThan3Amazon.length}`);
console.log(`Has banned words: ${hasBannedWords.length}`);
console.log(`Has emdash: ${hasEmdash.length}`);
console.log(`No image in image-map: ${noImage.length}`);

if (under1800.length > 0) {
  console.log('\n--- UNDER 1800 WORDS (need regeneration) ---');
  for (const a of under1800.slice(0, 20)) {
    console.log(`  ID ${a.id}: ${a.words} words — ${a.slug}`);
  }
  if (under1800.length > 20) console.log(`  ... and ${under1800.length - 20} more`);
}

if (hasBannedWords.length > 0) {
  console.log('\n--- HAS BANNED WORDS ---');
  for (const a of hasBannedWords.slice(0, 10)) {
    console.log(`  ID ${a.id}: ${a.words.join(', ')} — ${a.slug}`);
  }
  if (hasBannedWords.length > 10) console.log(`  ... and ${hasBannedWords.length - 10} more`);
}

if (noImage.length > 0) {
  console.log('\n--- NO IMAGE ASSIGNED ---');
  console.log(`  ${noImage.length} articles missing from image-map.json`);
  for (const a of noImage.slice(0, 5)) {
    console.log(`  ID ${a.id}: ${a.slug}`);
  }
}

// Write the IDs that need regeneration to a file for the regen script
import { writeFileSync } from 'fs';
const regenIds = under1800.map(a => a.id);
writeFileSync(join(ROOT, 'content/regen-needed.json'), JSON.stringify(regenIds));
console.log(`\nWrote ${regenIds.length} IDs to content/regen-needed.json for regeneration`);
