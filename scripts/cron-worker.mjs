import cron from 'node-cron';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('[cron] Cron worker started');

// Schedule 1: Mon-Fri at 12:00 UTC (6:00 AM MDT) — regular article generation
cron.schedule('0 12 * * 1-5', () => {
  console.log(`[cron] Triggering article generation at ${new Date().toISOString()}`);
  
  const child = spawn('node', [join(__dirname, 'generate-articles.mjs')], {
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 600000
  });

  child.on('error', (err) => {
    console.error('[cron] Generation error:', err);
  });

  child.on('exit', (code) => {
    console.log(`[cron] Generation exited with code ${code}`);
  });
}, {
  timezone: 'UTC'
});

// Schedule 2: Saturday at 14:00 UTC (8:00 AM MDT) — weekly product spotlight article
cron.schedule('0 14 * * 6', () => {
  console.log(`[cron] Triggering product spotlight generation at ${new Date().toISOString()}`);
  
  const child = spawn('node', [join(__dirname, 'generate-product-spotlight.mjs')], {
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 600000
  });

  child.on('error', (err) => {
    console.error('[cron] Product spotlight error:', err);
  });

  child.on('exit', (code) => {
    console.log(`[cron] Product spotlight exited with code ${code}`);
  });
}, {
  timezone: 'UTC'
});

// Support --run-now flag for testing
if (process.argv.includes('--run-now')) {
  console.log('[cron] --run-now flag detected, running immediately...');
  const child = spawn('node', [join(__dirname, 'generate-articles.mjs')], {
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 600000
  });

  child.on('exit', (code) => {
    console.log(`[cron] Test run exited with code ${code}`);
    process.exit(code || 0);
  });
}
