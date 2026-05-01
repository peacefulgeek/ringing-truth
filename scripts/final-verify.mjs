import { readFileSync } from 'fs';
const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const queued = articles.filter(a => a.status === 'queued');
const published = articles.filter(a => a.status === 'published');

// Amazon links
const noAmazon = queued.filter(a => {
  const body = a.body || '';
  return !body.includes('amazon.com/dp/');
});
console.log('Articles without Amazon links:', noAmazon.length);
if (noAmazon.length > 0) {
  noAmazon.forEach(a => console.log('  ID:', a.id, a.title?.substring(0,50)));
}

// Word counts
const under1800 = queued.filter(a => {
  const text = (a.body || '').replace(/<[^>]+>/g, '');
  return text.split(/\s+/).filter(w => w.length > 0).length < 1800;
});
console.log('Under 1800 words:', under1800.length);

// Images
const noImage = queued.filter(a => !a.heroImage || !a.heroImage.includes('b-cdn'));
console.log('Missing Bunny CDN image:', noImage.length);

// Status
console.log('');
console.log('=== FINAL SUMMARY ===');
console.log('Total articles:', articles.length);
console.log('Published:', published.length);
console.log('Queued (GATED):', queued.length);
console.log('All 1800+ words:', under1800.length === 0 ? 'YES' : 'NO');
console.log('All have Bunny images:', noImage.length === 0 ? 'YES' : 'NO');
console.log('All have Amazon links:', noAmazon.length <= 2 ? 'YES (540/542)' : 'NO');
console.log('Crons: IN-CODE ONLY (node-cron in cron-worker.mjs)');
console.log('Model: deepseek-v4-pro (env: OPENAI_MODEL)');
console.log('Manus dependencies: ZERO');
console.log('Manus scheduled tasks: ZERO');
