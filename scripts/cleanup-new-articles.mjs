import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
const imageMap = JSON.parse(readFileSync(join(ROOT, 'content/image-map.json'), 'utf8'));

const AMAZON_TAG = 'spankyspinola-20';
const CDN = 'https://ringing-truth.b-cdn.net';

const CATEGORIES = ['the-science', 'the-management', 'the-mind', 'the-body', 'the-deeper-listening'];

const AI_WORD_REPLACEMENTS = [
  [/\bdelve\b/gi, 'explore'], [/\btapestry\b/gi, 'mix'],
  [/\bparadigm\b/gi, 'model'], [/\bsynergy\b/gi, 'connection'],
  [/\bleverage\b/gi, 'use'], [/\bempower\b/gi, 'support'],
  [/\butilize\b/gi, 'use'], [/\bpivotal\b/gi, 'key'],
  [/\bembark\b/gi, 'start'], [/\bunderscore\b/gi, 'highlight'],
  [/\bparamount\b/gi, 'critical'], [/\bseamlessly\b/gi, 'smoothly'],
  [/\bbeacon\b/gi, 'signal'], [/\bfoster\b/gi, 'build'],
  [/\bcurated?\b/gi, 'selected'], [/\bbespoke\b/gi, 'custom'],
  [/\bharness\b/gi, 'use'], [/\bplethora\b/gi, 'range'],
  [/\bmyriad\b/gi, 'many'], [/\btransformative\b/gi, 'powerful'],
  [/\bgroundbreaking\b/gi, 'new'], [/\bmultifaceted\b/gi, 'complex'],
  [/\bstakeholders\b/gi, 'people involved'], [/\becosystem\b/gi, 'system'],
  [/\bstreamline\b/gi, 'simplify'], [/\bcatalyze\b/gi, 'trigger'],
  [/\bunveil\b/gi, 'show'], [/\bunravel\b/gi, 'untangle'],
  [/\bdemystify\b/gi, 'clarify'], [/\belucidate\b/gi, 'explain'],
  [/\bspearhead\b/gi, 'lead'], [/\borchestrate\b/gi, 'arrange'],
  [/\boverarching\b/gi, 'main'], [/\bconfluence\b/gi, 'meeting point'],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let fixedEmDash = 0, fixedWords = 0, fixedLinks = 0, fixedImages = 0, fixedCategory = 0;

for (const article of articles) {
  if (!article.body) continue;
  
  // Fix em-dashes
  if (article.body.includes('\u2014') || article.body.includes('&mdash;')) {
    article.body = article.body.replace(/\u2014/g, ', ').replace(/&mdash;/g, ', ');
    article.body = article.body.replace(/\u2013/g, ', ').replace(/&ndash;/g, ', ');
    fixedEmDash++;
  }
  
  // Fix AI words
  let changed = false;
  for (const [re, rep] of AI_WORD_REPLACEMENTS) {
    if (re.test(article.body)) {
      article.body = article.body.replace(re, rep);
      changed = true;
    }
  }
  if (changed) fixedWords++;
  
  // Ensure category is valid
  if (!article.category || !CATEGORIES.includes(article.category)) {
    article.category = CATEGORIES[article.id % CATEGORIES.length];
    article.categoryName = article.category.split('-').map(w => w === 'the' ? 'The' : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    fixedCategory++;
  }
  
  // Ensure slug
  if (!article.slug) {
    article.slug = (article.title || `article-${article.id}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }
  
  // Ensure dateISO
  if (!article.dateISO) {
    const start = new Date('2025-10-28').getTime();
    const end = new Date('2026-04-28').getTime();
    const offset = ((article.id || 0) / 900) * (end - start);
    article.dateISO = new Date(start + offset).toISOString().split('T')[0];
  }
  
  // Ensure readingTime
  if (!article.readingTime) {
    const words = article.body.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
    article.readingTime = Math.max(1, Math.ceil(words / 250));
  }
  
  // Ensure Amazon links (minimum 3)
  const amazonCount = (article.body.match(/amazon\.com\/dp\//g) || []).length;
  if (amazonCount < 3) {
    const needed = 3 - amazonCount;
    const prods = shuffle(catalog).slice(0, needed);
    const pTags = [...article.body.matchAll(/<\/p>/g)];
    if (pTags.length >= 4) {
      for (let i = 0; i < prods.length; i++) {
        const p = prods[i];
        const allP = [...article.body.matchAll(/<\/p>/g)];
        const insertPos = Math.floor(allP.length * (0.3 + i * 0.2));
        if (allP[insertPos]) {
          const idx = allP[insertPos].index + 4;
          const link = `<a href="https://www.amazon.com/dp/${p.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${p.name}</a> (paid link)`;
          article.body = article.body.slice(0, idx) + `\n<p>Many readers have found the ${link} genuinely helpful for this.</p>` + article.body.slice(idx);
        }
      }
      fixedLinks++;
    }
  }
  
  // Ensure tag on all Amazon links
  article.body = article.body.replace(/amazon\.com\/dp\/([A-Z0-9]{10})(?:\?tag=[^"]*)?/g, 
    `amazon.com/dp/$1?tag=${AMAZON_TAG}`);
  
  // Assign library image if not in image map
  if (!imageMap[article.slug]) {
    const libIdx = (article.id % 40) + 1;
    const padded = String(libIdx).padStart(2, '0');
    imageMap[article.slug] = {
      hero: `${CDN}/library/lib-${padded}.webp`,
      og: `${CDN}/library/lib-${padded}.webp`
    };
    fixedImages++;
  }
}

writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles));
writeFileSync(join(ROOT, 'content/image-map.json'), JSON.stringify(imageMap, null, 2));

console.log(`Total articles: ${articles.length}`);
console.log(`Fixed em-dashes: ${fixedEmDash}`);
console.log(`Fixed AI words: ${fixedWords}`);
console.log(`Fixed Amazon links: ${fixedLinks}`);
console.log(`Fixed images: ${fixedImages}`);
console.log(`Fixed categories: ${fixedCategory}`);
console.log(`Image map entries: ${Object.keys(imageMap).length}`);
