import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
const existingSlugs = new Set(articles.map(a => a.slug));
const maxId = Math.max(...articles.map(a => a.id || 0));

const CATEGORIES = [
  { slug: 'the-science', name: 'The Science' },
  { slug: 'the-management', name: 'The Management' },
  { slug: 'the-mind', name: 'The Mind' },
  { slug: 'the-body', name: 'The Body' },
  { slug: 'the-deeper-listening', name: 'The Deeper Listening' },
];

const OPENER_TYPES = ['scene-setting', 'provocation', 'first-person', 'question', 'named-reference', 'gut-punch'];

const TOTAL_NEEDED = 450;
const BATCH_SIZE = 10;
const numBatches = Math.ceil(TOTAL_NEEDED / BATCH_SIZE);

for (let b = 0; b < numBatches; b++) {
  const startIdx = b * BATCH_SIZE;
  const count = Math.min(BATCH_SIZE, TOTAL_NEEDED - startIdx);
  const startId = maxId + 1 + startIdx;
  
  const batchArticles = [];
  for (let i = 0; i < count; i++) {
    const globalIdx = startIdx + i;
    const id = startId + i;
    const category = CATEGORIES[globalIdx % CATEGORIES.length];
    const openerType = OPENER_TYPES[globalIdx % OPENER_TYPES.length];
    const faqCount = [0, 2, 2, 2, 3, 3, 3, 4, 4, 5][globalIdx % 10];
    const conclusionType = globalIdx % 10 < 3 ? 'challenge' : 'tender';
    
    // Pick 6 random products
    const shuffled = [...catalog].sort(() => Math.random() - 0.5);
    const products = shuffled.slice(0, 6);
    
    batchArticles.push({
      id, category: category.slug, categoryName: category.name,
      openerType, faqCount, conclusionType,
      products: products.map(p => ({ name: p.name, asin: p.asin }))
    });
  }
  
  const batchPath = join(ROOT, `content/parallel-batch-${String(b).padStart(3, '0')}.json`);
  writeFileSync(batchPath, JSON.stringify(batchArticles, null, 2));
}

console.log(`Created ${numBatches} batch files for ${TOTAL_NEEDED} articles (IDs ${maxId + 1} to ${maxId + TOTAL_NEEDED})`);
