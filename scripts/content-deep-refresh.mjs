// 90-day deep refresh: rewrites 25 articles with full humanization
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GH_PAT = process.env.GH_PAT;
const EDITORIAL_NAME = 'The Ringing Truth Editorial';
const AMAZON_TAG = 'spankyspinola-20';

const KALESH_PHRASES = [
  'The mind is not the enemy. The identification with it is.',
  'Awareness does not need to be cultivated. It needs to be uncovered.',
  'The nervous system does not respond to what you believe. It responds to what it senses.',
  'Every resistance is information. The question is whether you are willing to read it.',
  'The gap between stimulus and response is where your entire life lives.',
  'Sit with it long enough and even the worst feeling reveals its edges.',
  'The body remembers what the mind would prefer to file away.',
  'Information without integration is just intellectual hoarding.',
  'The body has a grammar. Most of us never learned to read it.',
  'You are not a problem to be solved. You are a process to be witnessed.',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error('[deep-refresh] ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  // Pick 25 articles that haven't been refreshed recently
  const candidates = articles
    .filter(a => !a.lastDeepRefresh || new Date(a.lastDeepRefresh) < new Date(Date.now() - 80 * 86400000))
    .sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''));
  
  const toRefresh = candidates.slice(0, 25);
  console.log(`[deep-refresh] Deep refreshing ${toRefresh.length} articles`);

  for (const article of toRefresh) {
    const phrases = shuffle(KALESH_PHRASES).slice(0, 3);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `Rewrite this tinnitus article in Kalesh's voice. 1200-1800 words. Long unfolding sentences (18-28 words avg). Cross-traditional. Intellectual warmth. NEVER use em dash, profound, transformative, holistic, nuanced, multifaceted, manifest, lean into, showing up for, authentic self, safe space, hold space, sacred container, raise your vibration. Include 2 conversational interjections. Include 1-2 first-person lived experience sentences. Embed these phrases as <blockquote>: ${phrases.join(' | ')}. HTML only: <h2>, <p>, <blockquote>.

MANDATORY: Include AT LEAST 3 Amazon product links woven naturally into the body paragraphs. Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow noopener">Product Name</a> (paid link). Also include a "Your Healing Journey" section with 2-3 more product links. Pick real tinnitus-related products (sound machines, supplements, headphones, books, sleep aids). Return HTML body only.`,
          messages: [{
            role: 'user',
            content: `Rewrite this article: "${article.title}" (category: ${article.categoryName})\n\nCurrent body (first 500 chars): ${(article.body || '').substring(0, 500)}\n\nReturn ONLY the HTML body.`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        let body = data.content[0].text;
        body = body.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        body = body.replace(/\u2014/g, ' - ').replace(/\u2013/g, ' - ');

        // ENFORCE: minimum 3 Amazon links
        const amazonCount = (body.match(/amazon\.com\/dp\//g) || []).length;
        if (amazonCount < 3) {
          console.log(`[deep-refresh] Only ${amazonCount} Amazon links in article ${article.id}, injecting more...`);
          const catalog = JSON.parse(readFileSync(join(ROOT, 'content/product-catalog.json'), 'utf8'));
          const shuffled = shuffle(catalog).slice(0, 3 - amazonCount);
          const pTags = [...body.matchAll(/<\/p>/g)];
          for (let pi = 0; pi < shuffled.length; pi++) {
            const ep = shuffled[pi];
            const allP = [...body.matchAll(/<\/p>/g)];
            const insertIdx = Math.floor(allP.length * (0.25 + pi * 0.2));
            if (allP[insertIdx]) {
              const pos = allP[insertIdx].index + 4;
              const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow noopener">${ep.name}</a> (paid link)`;
              body = body.slice(0, pos) + `\n<p>${ep.sentence}. Many readers have found the ${link} genuinely useful for this.</p>` + body.slice(pos);
            }
          }
        }
        
        const idx = articles.findIndex(a => a.id === article.id);
        if (idx >= 0) {
          articles[idx].body = body;
          articles[idx].lastDeepRefresh = new Date().toISOString().split('T')[0];
        }
        const finalCount = (body.match(/amazon\.com\/dp\//g) || []).length;
        console.log(`[deep-refresh] Rewrote article ${article.id}: ${article.title} (${finalCount} Amazon links)`);
      }
    } catch (e) {
      console.error(`[deep-refresh] Error on article ${article.id}: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log('[deep-refresh] Saved updated articles');

  if (GH_PAT) {
    try {
      const { execSync } = await import('child_process');
      execSync(`cd ${ROOT} && git add content/ && git commit -m "90-day deep refresh: ${toRefresh.length} articles" && git push`, {
        stdio: 'inherit',
        env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
      });
    } catch (e) {
      console.error('[deep-refresh] Git push failed:', e.message);
    }
  }
}

main().catch(err => {
  console.error('[deep-refresh] Fatal error:', err);
  process.exit(1);
});
