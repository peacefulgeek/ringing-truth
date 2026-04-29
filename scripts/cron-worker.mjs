// ─── CRON WORKER: DeepSeek V4-Pro ───
// Zero Claude. Zero Fal.ai. Zero GPT.
import cron from 'node-cron';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

function getPublishedCount() {
  try {
    const articlesPath = join(__dirname, '..', 'content', 'articles-all.json');
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    const now = new Date();
    return articles.filter(a => new Date(a.publishDate) <= now).length;
  } catch { return 0; }
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

  // ─── SMART RAMP-UP: COUNT-AWARE ARTICLE GENERATION ───
  //
  // Phase 1 (published < 200): 3 articles/weekday at 08:00, 12:00, 17:00 UTC
  // Phase 2 (published >= 200): 1 article/weekday at 08:00 UTC
  //
  // All 3 cron slots fire Mon-Fri. The 12:00 and 17:00 slots
  // check the article count and skip if >= 200.

  // Slot 1: 08:00 UTC Mon-Fri — ALWAYS runs (both phases)
  cron.schedule('0 8 * * 1-5', () => {
    runScript('article-gen-08', join(__dirname, 'generate-articles.mjs'));
  }, { timezone: 'UTC' });

  // Slot 2: 12:00 UTC Mon-Fri — Phase 1 only (< 200 published)
  cron.schedule('0 12 * * 1-5', () => {
    const count = getPublishedCount();
    if (count < 200) {
      runScript('article-gen-12', join(__dirname, 'generate-articles.mjs'));
    } else {
      console.log(`[cron] 12:00 slot skipped - ${count} published (cruise mode)`);
    }
  }, { timezone: 'UTC' });

  // Slot 3: 17:00 UTC Mon-Fri — Phase 1 only (< 200 published)
  cron.schedule('0 17 * * 1-5', () => {
    const count = getPublishedCount();
    if (count < 200) {
      runScript('article-gen-17', join(__dirname, 'generate-articles.mjs'));
    } else {
      console.log(`[cron] 17:00 slot skipped - ${count} published (cruise mode)`);
    }
  }, { timezone: 'UTC' });

  // Product spotlight — Saturday 08:00 UTC
  cron.schedule('0 8 * * 6', () => {
    runScript('product-spotlight', join(__dirname, 'generate-product-spotlight.mjs'));
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

  const pubCount = getPublishedCount();
  const phase = pubCount < 200 ? 'RAMP-UP (3/day)' : 'CRUISE (1/day)';
  console.log(`[cron] Published articles: ${pubCount} — Phase: ${phase}`);
  console.log('[cron] Schedules registered:');
  console.log('[cron]   Mon-Fri 08:00 UTC — article generation (always)');
  console.log('[cron]   Mon-Fri 12:00 UTC — article generation (ramp-up only, <200)');
  console.log('[cron]   Mon-Fri 17:00 UTC — article generation (ramp-up only, <200)');
  console.log('[cron]   Saturday 08:00 UTC — product spotlight');
  console.log('[cron]   1st of month 03:00 UTC — 30-day content refresh');
  console.log('[cron]   Quarterly 04:00 UTC — 90-day deep refresh');
  console.log('[cron]   Sunday 05:00 UTC — ASIN health check');
}

// Support --run-now flag for testing
const runNowIdx = process.argv.indexOf('--run-now');
if (runNowIdx !== -1) {
  const target = process.argv[runNowIdx + 1] || 'generate-articles.mjs';
  console.log(`[cron] --run-now flag detected, running ${target} immediately...`);
  const child = spawn('node', [join(__dirname, target)], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  child.on('exit', (code) => process.exit(code));
}
