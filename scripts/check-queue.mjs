import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const published = articles.filter(a => a.status === 'published');
const queued = articles.filter(a => a.status === 'queued');
const other = articles.filter(a => a.status !== 'published' && a.status !== 'queued');

console.log('Total:', articles.length);
console.log('Published:', published.length);
console.log('Queued:', queued.length);
console.log('Other/no status:', other.length);

const logPath = join(ROOT, 'content/queue-log.json');
if (existsSync(logPath)) {
  const log = JSON.parse(readFileSync(logPath, 'utf8'));
  console.log('Published from queue:', log.totalPublishedFromQueue);
  console.log('Phase:', log.totalPublishedFromQueue < 60 ? '1 (5/day)' : '2 (1/weekday)');
  console.log('Last 5 published:', log.history.slice(-5).map(h => `ID ${h.id} on ${h.date}`).join(', '));
}

// Check today's published articles
const today = new Date().toISOString().split('T')[0];
const todayPub = published.filter(a => a.dateISO === today);
console.log(`Published today (${today}):`, todayPub.length);

// Estimate completion
const remaining = queued.length;
const fromQueue = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')).totalPublishedFromQueue : 0;
if (fromQueue < 60) {
  const phase1Left = 60 - fromQueue;
  const phase1Days = Math.ceil(phase1Left / 5);
  const phase2Articles = remaining - phase1Left;
  const phase2Weeks = Math.ceil(phase2Articles / 5); // 5 per week (Mon-Fri)
  console.log(`Estimate: Phase 1 finishes in ${phase1Days} days, Phase 2 takes ~${phase2Weeks} weeks`);
} else {
  const weeks = Math.ceil(remaining / 5);
  console.log(`Estimate: Phase 2 - ${remaining} articles over ~${weeks} weeks`);
}
