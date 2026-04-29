// ─── PUBLISH FROM QUEUE ───
// Picks articles from the pre-written queue and publishes them with today's date.
// Phase 1 (first 60 from queue): 5/day every day — runs for ~12 days
// Phase 2 (remaining ~440+): 1/weekday (Mon-Fri) — runs for ~88 weeks
// When queue is empty: falls back to DeepSeek generation
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const articlesPath = join(ROOT, 'content', 'all-articles.json');
const queueLogPath = join(ROOT, 'content', 'queue-log.json');

// ─── Load queue log (tracks how many have been published from queue) ───
function loadQueueLog() {
  if (existsSync(queueLogPath)) {
    return JSON.parse(readFileSync(queueLogPath, 'utf8'));
  }
  return { totalPublishedFromQueue: 0, history: [] };
}

function saveQueueLog(log) {
  writeFileSync(queueLogPath, JSON.stringify(log, null, 2));
}

// ─── Determine how many to publish today ───
function getPublishCount(log) {
  const published = log.totalPublishedFromQueue;
  
  if (published < 60) {
    // Phase 1: 5/day every day (including weekends) until 60 are out
    const remaining = 60 - published;
    return Math.min(5, remaining);
  }
  
  // Phase 2: 1/weekday (Mon-Fri)
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) {
    console.log('[queue] Weekend — Phase 2 only publishes Mon-Fri. Skipping.');
    return 0;
  }
  return 1;
}

// ─── Main ───
async function main() {
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  const log = loadQueueLog();
  
  const queued = articles.filter(a => a.status === 'queued');
  console.log(`[queue] Total articles: ${articles.length}`);
  console.log(`[queue] Queued: ${queued.length}`);
  console.log(`[queue] Published from queue so far: ${log.totalPublishedFromQueue}`);
  
  if (queued.length === 0) {
    console.log('[queue] Queue is EMPTY. Falling back to DeepSeek generation.');
    // Spawn the generate-articles.mjs script
    const child = spawn('node', [join(__dirname, 'generate-articles.mjs')], {
      stdio: 'inherit',
      env: { ...process.env },
      timeout: 900000
    });
    child.on('exit', (code) => {
      console.log(`[queue] DeepSeek generation exited with code ${code}`);
      process.exit(code);
    });
    return;
  }
  
  const count = getPublishCount(log);
  if (count === 0) {
    process.exit(0);
    return;
  }
  
  const phase = log.totalPublishedFromQueue < 60 ? 1 : 2;
  console.log(`[queue] Phase ${phase}: Publishing ${count} article(s) today`);
  
  const today = new Date().toISOString().split('T')[0];
  const toPublish = queued.slice(0, count);
  
  for (const article of toPublish) {
    article.status = 'published';
    article.dateISO = today;
    console.log(`[queue] Published: "${article.title?.slice(0, 60)}..." (ID ${article.id})`);
    
    log.totalPublishedFromQueue++;
    log.history.push({
      id: article.id,
      slug: article.slug,
      date: today,
      phase
    });
  }
  
  // Save updated articles and log
  writeFileSync(articlesPath, JSON.stringify(articles));
  saveQueueLog(log);
  
  console.log(`[queue] Done. Published ${count} articles. Queue remaining: ${queued.length - count}`);
  console.log(`[queue] Total published from queue: ${log.totalPublishedFromQueue}`);
  
  // If we just crossed the Phase 1 → Phase 2 boundary, log it
  if (log.totalPublishedFromQueue >= 60 && log.totalPublishedFromQueue - count < 60) {
    console.log('[queue] === PHASE 1 COMPLETE === Switching to Phase 2 (1/weekday)');
  }
  
  // Push to GitHub if GH_PAT is set
  if (process.env.GH_PAT) {
    console.log('[queue] Pushing updated articles to GitHub...');
    const git = spawn('sh', ['-c', `cd ${ROOT} && git add content/all-articles.json content/queue-log.json && git commit -m "Queue publish: ${count} articles on ${today}" && git push origin main`], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    git.on('exit', (code) => {
      console.log(`[queue] Git push exited with code ${code}`);
    });
  }
}

main().catch(err => {
  console.error('[queue] Fatal error:', err);
  process.exit(1);
});
