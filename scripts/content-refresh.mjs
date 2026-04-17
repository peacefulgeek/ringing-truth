// 30-day content refresh: cleans banned words, fixes em-dashes, enforces 3+ Amazon links on 10 oldest articles
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GH_PAT = process.env.GH_PAT;
const EDITORIAL_NAME = 'The Ringing Truth Editorial';
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';

const WORD_REPLACEMENTS = {
  'delve': 'explore', 'tapestry': 'pattern', 'paradigm': 'model', 'synergy': 'connection',
  'leverage': 'use', 'unlock': 'open', 'empower': 'support', 'utilize': 'use',
  'pivotal': 'key', 'embark': 'begin', 'underscore': 'highlight', 'paramount': 'essential',
  'seamlessly': 'smoothly', 'robust': 'strong', 'beacon': 'guide', 'foster': 'encourage',
  'elevate': 'raise', 'curate': 'select', 'curated': 'selected', 'bespoke': 'custom',
  'resonate': 'connect', 'harness': 'use', 'intricate': 'complex', 'plethora': 'many',
  'myriad': 'many', 'comprehensive': 'thorough', 'transformative': 'powerful',
  'groundbreaking': 'important', 'innovative': 'new', 'profound': 'deep',
  'holistic': 'whole-body', 'nuanced': 'subtle', 'multifaceted': 'complex',
  'furthermore': 'also', 'moreover': 'also', 'additionally': 'also',
  'consequently': 'so', 'subsequently': 'then', 'thereby': 'so',
  'streamline': 'simplify', 'optimize': 'improve', 'facilitate': 'help',
  'amplify': 'increase', 'catalyze': 'spark',
  'manifest': 'appear', 'manifestation': 'expression',
  'lean into': 'move toward', 'showing up for': 'being present with',
  'authentic self': 'true nature', 'safe space': 'supportive environment',
  'hold space': 'be present', 'sacred container': 'supportive setting',
  'raise your vibration': 'shift your awareness'
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];

  // Pick 10 oldest articles that haven't been refreshed in 25+ days
  const candidates = articles
    .filter(a => !a.lastRefreshed || new Date(a.lastRefreshed) < new Date(Date.now() - 25 * 86400000))
    .sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''));

  const toRefresh = candidates.slice(0, 10);
  console.log(`[refresh] Refreshing ${toRefresh.length} articles`);

  let fixed = 0;
  for (const article of toRefresh) {
    let body = article.body || '';
    let changes = 0;

    // Remove em-dashes
    if (body.includes('\u2014') || body.includes('\u2013') || body.includes('&mdash;') || body.includes('&ndash;')) {
      body = body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
      body = body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');
      changes++;
    }

    // Replace banned words and phrases
    for (const [word, replacement] of Object.entries(WORD_REPLACEMENTS)) {
      const re = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      if (re.test(body)) {
        body = body.replace(re, replacement);
        changes++;
      }
    }

    // Enforce minimum 3 Amazon links
    const amazonCount = (body.match(/amazon\.com\/dp\//g) || []).length;
    if (amazonCount < 3 && catalog.length >= 3) {
      const extra = shuffle(catalog).slice(0, 3 - amazonCount);
      for (let pi = 0; pi < extra.length; pi++) {
        const ep = extra[pi];
        const allP = [...body.matchAll(/<\/p>/g)];
        const insertIdx = Math.floor(allP.length * (0.3 + pi * 0.2));
        if (allP[insertIdx]) {
          const pos = allP[insertIdx].index + 4;
          const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${ep.name}</a> (paid link)`;
          body = body.slice(0, pos) + `\n<p>Many readers have found the ${link} genuinely useful here.</p>` + body.slice(pos);
          changes++;
        }
      }
    }

    if (changes > 0) {
      const idx = articles.findIndex(a => a.id === article.id);
      if (idx >= 0) {
        articles[idx].body = body;
        articles[idx].lastRefreshed = new Date().toISOString().split('T')[0];
        fixed++;
      }
      const finalLinks = (body.match(/amazon\.com\/dp\//g) || []).length;
      console.log(`[refresh] Fixed article ${article.id}: ${article.title} (${changes} changes, ${finalLinks} Amazon links)`);
    } else {
      const idx = articles.findIndex(a => a.id === article.id);
      if (idx >= 0) articles[idx].lastRefreshed = new Date().toISOString().split('T')[0];
      console.log(`[refresh] No changes needed for article ${article.id}: ${article.title}`);
    }
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log(`[refresh] Done. Fixed ${fixed}/${toRefresh.length} articles`);

  if (GH_PAT) {
    try {
      const { execSync } = await import('child_process');
      execSync(`cd ${ROOT} && git add content/ && git commit -m "30-day refresh: ${fixed} articles cleaned" && git push`, {
        stdio: 'inherit',
        env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
      });
    } catch (e) {
      console.error('[refresh] Git push failed:', e.message);
    }
  }
}

main().catch(err => {
  console.error('[refresh] Fatal error:', err);
  process.exit(1);
});
