import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

console.log('[start] Starting web server and cron worker...');

// Start web server
const web = spawn('node', [join(ROOT, 'server.mjs')], {
  stdio: 'inherit',
  env: { ...process.env }
});

web.on('error', (err) => {
  console.error('[start] Web server error:', err);
  process.exit(1);
});

web.on('exit', (code) => {
  console.log(`[start] Web server exited with code ${code}`);
  process.exit(code || 0);
});

// Start cron worker
const cron = spawn('node', [join(__dirname, 'cron-worker.mjs')], {
  stdio: 'inherit',
  env: { ...process.env }
});

cron.on('error', (err) => {
  console.error('[start] Cron worker error:', err);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('[start] SIGTERM received, shutting down...');
  web.kill('SIGTERM');
  cron.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[start] SIGINT received, shutting down...');
  web.kill('SIGINT');
  cron.kill('SIGINT');
});
