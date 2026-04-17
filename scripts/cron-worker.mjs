import cron from 'node-cron';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

console.log('[cron] Cron worker started');

if (!AUTO_GEN) {
  console.log('[cron] AUTO_GEN_ENABLED != "true" — cron disabled');
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

  // 1. Article generation — Mon-Fri 06:00 UTC (5/week)
  cron.schedule('0 6 * * 1-5', () => {
    runScript('article-generation', join(__dirname, 'generate-articles.mjs'));
  }, { timezone: 'UTC' });

  // 2. Product spotlight — Saturday 08:00 UTC (1/week)
  cron.schedule('0 8 * * 6', () => {
    runScript('product-spotlight', join(__dirname, 'generate-product-spotlight.mjs'));
  }, { timezone: 'UTC' });

  // 3. Monthly content refresh — 1st of month 03:00 UTC
  cron.schedule('0 3 1 * *', () => {
    runScript('30-day-refresh', join(__dirname, 'content-refresh.mjs'));
  }, { timezone: 'UTC' });

  // 4. Quarterly content refresh — Jan/Apr/Jul/Oct 1st at 04:00 UTC
  cron.schedule('0 4 1 1,4,7,10 *', () => {
    runScript('90-day-deep-refresh', join(__dirname, 'content-deep-refresh.mjs'));
  }, { timezone: 'UTC' });

  // 5. ASIN health check — Sundays 05:00 UTC
  cron.schedule('0 5 * * 0', () => {
    runScript('product-refresh', join(__dirname, 'product-refresh.mjs'));
  }, { timezone: 'UTC' });

  console.log('[cron] All 5 schedules registered (AUTO_GEN_ENABLED=true)');
}

// Support --run-now flag for testing
if (process.argv.includes('--run-now')) {
  const target = process.argv[process.argv.indexOf('--run-now') + 1] || 'generate-articles.mjs';
  console.log(`[cron] --run-now flag detected, running ${target} immediately...`);
  const { spawn: sp } = await import('child_process');
  const child = sp('node', [join(__dirname, target)], { stdio: 'inherit', env: { ...process.env } });
  child.on('exit', (code) => process.exit(code));
}
