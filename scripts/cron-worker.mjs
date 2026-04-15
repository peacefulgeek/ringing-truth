import cron from 'node-cron';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('[cron] Cron worker started');

function runScript(name, scriptPath) {
  console.log(`[cron] Triggering ${name} at ${new Date().toISOString()}`);
  
  const child = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 600000
  });

  child.on('error', (err) => {
    console.error(`[cron] ${name} error:`, err);
  });

  child.on('exit', (code) => {
    console.log(`[cron] ${name} exited with code ${code}`);
  });
}

// Schedule 1: Mon-Fri at 12:00 UTC (6:00 AM MDT) - regular article generation
// Generates 5 articles per weekday with full humanization rules
cron.schedule('0 12 * * 1-5', () => {
  runScript('article-generation', join(__dirname, 'generate-articles.mjs'));
}, { timezone: 'UTC' });

// Schedule 2: Saturday at 14:00 UTC (8:00 AM MDT) - weekly product spotlight
cron.schedule('0 14 * * 6', () => {
  runScript('product-spotlight', join(__dirname, 'generate-product-spotlight.mjs'));
}, { timezone: 'UTC' });

// Schedule 3: 1st of every month at 03:00 UTC - 30-day content refresh
// Refreshes 10 oldest articles with updated voice, links, and humanization
cron.schedule('0 3 1 * *', () => {
  runScript('30-day-refresh', join(__dirname, 'content-refresh.mjs'));
}, { timezone: 'UTC' });

// Schedule 4: 1st of Jan, Apr, Jul, Oct at 04:00 UTC - 90-day deep refresh
// Rewrites 25 articles with lowest engagement signals
cron.schedule('0 4 1 1,4,7,10 *', () => {
  runScript('90-day-deep-refresh', join(__dirname, 'content-deep-refresh.mjs'));
}, { timezone: 'UTC' });

// Support --run-now flag for testing
if (process.argv.includes('--run-now')) {
  console.log('[cron] --run-now flag detected, running immediately...');
  runScript('test-run', join(__dirname, 'generate-articles.mjs'));
}
