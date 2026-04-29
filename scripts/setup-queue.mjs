// ─── SETUP PUBLISH QUEUE ───
// Keeps original 303 articles published, moves bulk-seeded 542 to queue
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const articlesPath = join(ROOT, 'content', 'all-articles.json');

const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

const today = new Date().toISOString().split('T')[0]; // 2026-04-29

let published = 0, queued = 0;

for (const a of articles) {
  if (a.id <= 303) {
    // Original articles — keep published with their existing dates
    a.status = 'published';
    // Make sure date is in the past
    if (!a.dateISO || a.dateISO > today) {
      a.dateISO = '2026-01-15'; // safe past date
    }
    published++;
  } else {
    // Bulk-seeded articles — move to queue
    a.status = 'queued';
    delete a.dateISO;     // Remove any date — cron will assign it
    delete a.publishDate; // Remove any publish date
    queued++;
  }
}

writeFileSync(articlesPath, JSON.stringify(articles));

console.log(`Total: ${articles.length}`);
console.log(`Published (original): ${published}`);
console.log(`Queued (bulk-seeded): ${queued}`);
console.log('Queue setup complete. Cron will publish from queue.');
