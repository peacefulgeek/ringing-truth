import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log('[build] Starting build...');

// Create dist directories
mkdirSync(join(DIST, 'assets'), { recursive: true });

// Copy public files to dist
const publicDir = join(ROOT, 'public');
function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(publicDir, DIST);

// Write a minimal CSS file to dist/assets
writeFileSync(join(DIST, 'assets', 'app.css'), '/* Styles are inline in SSR templates */\n');

// Validate content exists
const contentDir = join(ROOT, 'content');
const articlesPath = join(contentDir, 'all-articles.json');
const imageMapPath = join(contentDir, 'image-map.json');

if (!existsSync(articlesPath)) {
  console.error('[build] ERROR: content/all-articles.json not found!');
  process.exit(1);
}
if (!existsSync(imageMapPath)) {
  console.error('[build] ERROR: content/image-map.json not found!');
  process.exit(1);
}

// Validate article count
const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
console.log(`[build] Articles: ${articles.length}`);

if (articles.length < 300) {
  console.warn(`[build] WARNING: Only ${articles.length} articles found (expected 300)`);
}

// Check date distribution
const now = new Date();
const published = articles.filter(a => new Date(a.dateISO) <= now);
const gated = articles.filter(a => new Date(a.dateISO) > now);
console.log(`[build] Published: ${published.length}, Gated: ${gated.length}`);

// Validate image map
const imageMap = JSON.parse(readFileSync(imageMapPath, 'utf8'));
const imageSlugs = Object.keys(imageMap);
console.log(`[build] Image map entries: ${imageSlugs.length}`);

console.log('[build] Build complete!');
