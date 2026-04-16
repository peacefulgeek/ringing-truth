// ─── PRODUCT CATALOG REFRESH ───
// Runs weekly (Sunday 05:00 UTC) via cron
// Checks all Amazon ASINs for availability, updates product titles,
// removes discontinued products, and replaces broken links in articles.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AMAZON_TAG = 'spankyspinola-20';
const GH_PAT = process.env.GH_PAT;
const EDITORIAL_NAME = 'The Ringing Truth Editorial';

// Rate-limit: wait between requests to avoid Amazon throttling
const DELAY_MS = 2000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// User-Agent to mimic a real browser
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function checkAsin(asin) {
  const url = `https://www.amazon.com/dp/${asin}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });

    if (res.status === 404) return { asin, status: 'broken', title: '' };

    const html = await res.text();

    // Check for dog page / "looking for something" error
    if (html.includes('Sorry! We couldn') || html.includes('looking for something') ||
        html.includes('Page Not Found') || html.includes('the page you requested cannot be found')) {
      return { asin, status: 'broken', title: '' };
    }

    // Extract product title
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>\s*(.*?)\s*<\/span>/s);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';

    // Check if product is currently unavailable
    const unavailable = html.includes('Currently unavailable') && html.includes('We don\'t know when or if this item will be back in stock');

    if (unavailable) {
      return { asin, status: 'unavailable', title };
    }

    return { asin, status: 'ok', title: title || '' };
  } catch (e) {
    // Network errors, timeouts - treat as unknown, don't remove
    console.log(`  [warn] Network error checking ${asin}: ${e.message}`);
    return { asin, status: 'network-error', title: '' };
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log('[product-refresh] Starting product catalog refresh...');

  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const articlesPath = join(ROOT, 'content/all-articles.json');

  if (!existsSync(catalogPath) || !existsSync(articlesPath)) {
    console.error('[product-refresh] Missing catalog or articles file');
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  console.log(`[product-refresh] Checking ${catalog.length} products...`);

  const okProducts = [];
  const brokenAsins = new Set();
  const unavailableAsins = new Set();
  const updatedTitles = new Map();
  let networkErrors = 0;

  // Check each ASIN
  for (let i = 0; i < catalog.length; i++) {
    const product = catalog[i];
    const result = await checkAsin(product.asin);

    if (result.status === 'ok') {
      // Update title if Amazon has a different one
      if (result.title && result.title.length > 5 && result.title !== product.name) {
        updatedTitles.set(product.asin, result.title);
        product.name = result.title;
      }
      product.lastChecked = new Date().toISOString().split('T')[0];
      okProducts.push(product);
    } else if (result.status === 'unavailable') {
      // Keep in catalog but flag - might come back
      product.unavailable = true;
      product.lastChecked = new Date().toISOString().split('T')[0];
      if (result.title) product.name = result.title;
      okProducts.push(product);
      unavailableAsins.add(product.asin);
      console.log(`  [unavailable] ${product.asin}: ${product.name}`);
    } else if (result.status === 'broken') {
      brokenAsins.add(product.asin);
      console.log(`  [broken] ${product.asin}: ${product.name}`);
    } else {
      // Network error - keep the product, don't remove on transient failures
      product.lastChecked = product.lastChecked || '';
      okProducts.push(product);
      networkErrors++;
    }

    // Progress log every 20 products
    if ((i + 1) % 20 === 0) {
      console.log(`  Checked ${i + 1}/${catalog.length}...`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n[product-refresh] Results:`);
  console.log(`  OK: ${okProducts.filter(p => !p.unavailable).length}`);
  console.log(`  Unavailable: ${unavailableAsins.size}`);
  console.log(`  Broken/removed: ${brokenAsins.size}`);
  console.log(`  Network errors (kept): ${networkErrors}`);
  console.log(`  Titles updated: ${updatedTitles.size}`);

  // Save updated catalog
  writeFileSync(catalogPath, JSON.stringify(okProducts, null, 2));
  console.log(`[product-refresh] Saved updated catalog: ${okProducts.length} products`);

  // If we have broken ASINs, replace them in articles
  if (brokenAsins.size > 0) {
    console.log(`\n[product-refresh] Replacing ${brokenAsins.size} broken ASINs in articles...`);

    const availableProducts = okProducts.filter(p => !p.unavailable);
    let totalReplaced = 0;
    let articlesFixed = 0;

    for (const article of articles) {
      if (!article.body) continue;

      let body = article.body;
      let replaced = false;

      for (const brokenAsin of brokenAsins) {
        // Check if this article uses this broken ASIN
        if (body.includes(brokenAsin)) {
          // Pick a random available replacement
          const replacement = availableProducts[Math.floor(Math.random() * availableProducts.length)];
          if (!replacement) continue;

          // Replace the ASIN and product name in the link
          const linkRegex = new RegExp(
            `(<a[^>]*href=["']https?://(?:www\\.)?amazon\\.com/dp/)${brokenAsin}(\\?tag=${AMAZON_TAG}["'][^>]*>)([^<]*)(</a>)`,
            'g'
          );

          body = body.replace(linkRegex, `$1${replacement.asin}$2${replacement.name}$4`);

          // Also handle any bare ASIN references (without full link markup)
          body = body.replace(
            new RegExp(`amazon\\.com/dp/${brokenAsin}`, 'g'),
            `amazon.com/dp/${replacement.asin}`
          );

          totalReplaced++;
          replaced = true;
        }
      }

      if (replaced) {
        article.body = body;
        articlesFixed++;
      }
    }

    console.log(`  Articles fixed: ${articlesFixed}`);
    console.log(`  Total link replacements: ${totalReplaced}`);

    // Save updated articles
    writeFileSync(articlesPath, JSON.stringify(articles));
    console.log(`[product-refresh] Saved updated articles`);
  }

  // Also update titles in articles where they changed
  if (updatedTitles.size > 0) {
    console.log(`\n[product-refresh] Updating ${updatedTitles.size} product titles in articles...`);
    let titleUpdates = 0;

    for (const article of articles) {
      if (!article.body) continue;
      let body = article.body;
      let changed = false;

      for (const [asin, newTitle] of updatedTitles) {
        // Find links with this ASIN and update the display text
        const linkRegex = new RegExp(
          `(<a[^>]*href=["']https?://(?:www\\.)?amazon\\.com/dp/${asin}\\?tag=${AMAZON_TAG}["'][^>]*>)([^<]*)(</a>)`,
          'g'
        );

        const newBody = body.replace(linkRegex, (match, prefix, oldText, suffix) => {
          // Only update if the old text looks like a product name (not a custom anchor)
          if (oldText.length > 10 && !oldText.includes('click here')) {
            titleUpdates++;
            changed = true;
            return `${prefix}${newTitle}${suffix}`;
          }
          return match;
        });

        body = newBody;
      }

      if (changed) article.body = body;
    }

    writeFileSync(articlesPath, JSON.stringify(articles));
    console.log(`  Title updates in articles: ${titleUpdates}`);
  }

  // Verify all articles still have 3+ Amazon links
  let under3 = 0;
  for (const a of articles) {
    const count = ((a.body || '').match(/amazon\.com\/dp\/[A-Z0-9]{10}/g) || []).length;
    if (count < 3) under3++;
  }

  if (under3 > 0) {
    console.log(`\n[product-refresh] WARNING: ${under3} articles have < 3 Amazon links. Injecting...`);
    const availableProducts = okProducts.filter(p => !p.unavailable);

    for (const article of articles) {
      const body = article.body || '';
      const count = (body.match(/amazon\.com\/dp\/[A-Z0-9]{10}/g) || []).length;

      if (count < 3 && availableProducts.length >= 3) {
        const needed = 3 - count;
        const extras = shuffle(availableProducts).slice(0, needed);
        let newBody = body;
        const pTags = [...newBody.matchAll(/<\/p>/g)];

        for (let pi = 0; pi < extras.length; pi++) {
          const ep = extras[pi];
          const allP = [...newBody.matchAll(/<\/p>/g)];
          const insertIdx = Math.floor(allP.length * (0.25 + pi * 0.2));
          if (allP[insertIdx]) {
            const pos = allP[insertIdx].index + 4;
            const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow noopener">${ep.name}</a> (paid link)`;
            newBody = newBody.slice(0, pos) + `\n<p>Many readers have found the ${link} genuinely useful for this.</p>` + newBody.slice(pos);
          }
        }
        article.body = newBody;
      }
    }

    writeFileSync(articlesPath, JSON.stringify(articles));
    console.log(`  Fixed ${under3} articles`);
  }

  console.log(`\n[product-refresh] Articles with < 3 links: ${under3}`);

  // Save a refresh log
  const logEntry = {
    date: new Date().toISOString(),
    catalogBefore: catalog.length,
    catalogAfter: okProducts.length,
    broken: [...brokenAsins],
    unavailable: [...unavailableAsins],
    titlesUpdated: updatedTitles.size,
    networkErrors,
    articlesUnder3After: under3
  };

  const logPath = join(ROOT, 'content/product-refresh-log.json');
  let logs = [];
  if (existsSync(logPath)) {
    try { logs = JSON.parse(readFileSync(logPath, 'utf8')); } catch (e) {}
  }
  logs.push(logEntry);
  // Keep last 52 entries (1 year of weekly logs)
  if (logs.length > 52) logs = logs.slice(-52);
  writeFileSync(logPath, JSON.stringify(logs, null, 2));

  // Git push
  if (GH_PAT) {
    try {
      const { execSync } = await import('child_process');
      const msg = `Product refresh: ${brokenAsins.size} removed, ${updatedTitles.size} titles updated, ${okProducts.length} products active`;
      execSync(`cd ${ROOT} && git add content/ && git commit -m "${msg}" && git push`, {
        stdio: 'inherit',
        env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
      });
      console.log('[product-refresh] Pushed to GitHub');
    } catch (e) {
      console.error('[product-refresh] Git push failed:', e.message);
    }
  }

  console.log('[product-refresh] Done!');
}

main().catch(err => {
  console.error('[product-refresh] Fatal error:', err);
  process.exit(1);
});
