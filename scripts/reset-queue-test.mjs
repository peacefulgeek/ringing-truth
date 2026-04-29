// Reset the 5 test-published articles back to queued
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));

let reset = 0;
for (const a of articles) {
  if (a.id > 303 && a.status === 'published') {
    a.status = 'queued';
    delete a.dateISO;
    reset++;
  }
}

writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles));
writeFileSync(join(ROOT, 'content/queue-log.json'), JSON.stringify({ totalPublishedFromQueue: 0, history: [] }, null, 2));

console.log(`Reset ${reset} articles back to queued`);
console.log('Queue log cleared');

// Verify
const pub = articles.filter(a => a.status === 'published').length;
const q = articles.filter(a => a.status === 'queued').length;
console.log(`Published: ${pub}, Queued: ${q}`);
