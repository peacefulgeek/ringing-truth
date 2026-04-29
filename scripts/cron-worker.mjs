// ─── CRON WORKER: Queue-Based Publishing + DeepSeek V4-Pro Fallback ───
// Zero Claude. Zero Fal.ai. Zero GPT.
import cron from 'node-cron';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

function getQueueStats() {
  try {
    const articlesPath = join(__dirname, '..', 'content', 'all-articles.json');
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    const now = new Date();
    const published = articles.filter(a => a.status === 'published' || (a.dateISO && new Date(a.dateISO) <= now));
    const queued = articles.filter(a => a.status === 'queued');
    
    let queueLog = { totalPublishedFromQueue: 0 };
    const logPath = join(__dirname, '..', 'content', 'queue-log.json');
    if (fs.existsSync(logPath)) {
      queueLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    return {
      total: articles.length,
      published: published.length,
      queued: queued.length,
      publishedFromQueue: queueLog.totalPublishedFromQueue,
      phase: queueLog.totalPublishedFromQueue < 60 ? 1 : 2
    };
  } catch { return { total: 0, published: 0, queued: 0, publishedFromQueue: 0, phase: 1 }; }
}

console.log('[cron] Cron worker started');
console.log(`[cron] AUTO_GEN_ENABLED=${AUTO_GEN}`);
console.log(`[cron] DEEPSEEK_API_KEY=${process.env.DEEPSEEK_API_KEY ? 'set' : 'NOT SET'}`);

if (!AUTO_GEN) {
  console.log('[cron] AUTO_GEN_ENABLED != "true" - cron disabled');
} else {
  function runScript(name, scriptPath) {
    console.log(`[cron] Triggering ${name} at ${new Date().toISOString()}`);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env },
      timeout: 900000
    });
    child.on('error', (err) => {
      console.error(`[cron] ${name} error:`, err);
    });
    child.on('exit', (code) => {
      console.log(`[cron] ${name} exited with code ${code}`);
    });
  }

  // ─── PUBLISH FROM QUEUE ───
  //
  // Phase 1 (first 60 from queue): 5/day EVERY DAY including weekends
  //   → Runs at 08:00 UTC daily. The script handles publishing 5 at once.
  //   → Takes ~12 days to clear first 60.
  //
  // Phase 2 (remaining ~440+): 1/weekday (Mon-Fri)
  //   → Same 08:00 UTC cron fires daily, but the script skips weekends
  //     and only publishes 1 article on weekdays.
  //   → Takes ~88 weeks (~1.7 years) to clear.
  //
  // Queue empty: The publish-from-queue.mjs script automatically falls
  //   back to generate-articles.mjs (DeepSeek V4-Pro) when nothing is left.

  // Daily at 08:00 UTC — publish from queue (or generate if empty)
  cron.schedule('0 8 * * *', () => {
    const stats = getQueueStats();
    console.log(`[cron] Queue check: ${stats.queued} queued, ${stats.publishedFromQueue} published from queue, Phase ${stats.phase}`);
    runScript('publish-from-queue', join(__dirname, 'publish-from-queue.mjs'));
  }, { timezone: 'UTC' });

  // Product spotlight — Saturday 14:00 UTC (only when queue is empty, to avoid flooding)
  cron.schedule('0 14 * * 6', () => {
    const stats = getQueueStats();
    if (stats.queued === 0) {
      runScript('product-spotlight', join(__dirname, 'generate-product-spotlight.mjs'));
    } else {
      console.log(`[cron] Product spotlight skipped — queue still has ${stats.queued} articles`);
    }
  }, { timezone: 'UTC' });

  // Monthly content refresh — 1st of month 03:00 UTC
  cron.schedule('0 3 1 * *', () => {
    runScript('30-day-refresh', join(__dirname, 'content-refresh.mjs'));
  }, { timezone: 'UTC' });

  // Quarterly deep refresh — Jan/Apr/Jul/Oct 1st at 04:00 UTC
  cron.schedule('0 4 1 1,4,7,10 *', () => {
    runScript('90-day-deep-refresh', join(__dirname, 'content-deep-refresh.mjs'));
  }, { timezone: 'UTC' });

  // ASIN health check — Sundays 05:00 UTC
  cron.schedule('0 5 * * 0', () => {
    runScript('product-refresh', join(__dirname, 'product-refresh.mjs'));
  }, { timezone: 'UTC' });

  const stats = getQueueStats();
  console.log(`[cron] ─── QUEUE STATUS ───`);
  console.log(`[cron] Total articles: ${stats.total}`);
  console.log(`[cron] Published: ${stats.published}`);
  console.log(`[cron] Queued: ${stats.queued}`);
  console.log(`[cron] Published from queue: ${stats.publishedFromQueue}`);
  console.log(`[cron] Current phase: ${stats.phase === 1 ? 'PHASE 1 (5/day every day, first 60)' : 'PHASE 2 (1/weekday, remaining queue)'}`);
  console.log('[cron] ─── SCHEDULES ───');
  console.log('[cron]   Daily 08:00 UTC — publish from queue (5/day Phase 1, 1/weekday Phase 2, DeepSeek fallback when empty)');
  console.log('[cron]   Saturday 14:00 UTC — product spotlight (only when queue empty)');
  console.log('[cron]   1st of month 03:00 UTC — 30-day content refresh');
  console.log('[cron]   Quarterly 04:00 UTC — 90-day deep refresh');
  console.log('[cron]   Sunday 05:00 UTC — ASIN health check');
}

// Support --run-now flag for testing
const runNowIdx = process.argv.indexOf('--run-now');
if (runNowIdx !== -1) {
  const target = process.argv[runNowIdx + 1] || 'publish-from-queue.mjs';
  console.log(`[cron] --run-now flag detected, running ${target} immediately...`);
  const child = spawn('node', [join(__dirname, target)], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  child.on('exit', (code) => process.exit(code));
}
