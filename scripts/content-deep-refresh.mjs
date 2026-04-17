// 90-day deep refresh: rewrites 25 articles with full humanization + quality gate
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GH_PAT = process.env.GH_PAT;
const EDITORIAL_NAME = 'The Ringing Truth Editorial';
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';

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

  const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');

  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];

  // Pick 25 articles that haven't been refreshed recently
  const candidates = articles
    .filter(a => !a.lastDeepRefresh || new Date(a.lastDeepRefresh) < new Date(Date.now() - 80 * 86400000))
    .sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''));
  
  const toRefresh = candidates.slice(0, 25);
  console.log(`[deep-refresh] Deep refreshing ${toRefresh.length} articles`);

  let refreshed = 0;
  for (const article of toRefresh) {
    const phrases = shuffle(KALESH_PHRASES).slice(0, 3);
    const selectedProducts = shuffle(catalog).slice(0, 6);
    const productContext = selectedProducts.map(p =>
      `${p.name} (ASIN: ${p.asin})`
    ).join('\n');
    const originalBody = article.body;
    let passed = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
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
            system: `Rewrite this tinnitus article in Kalesh's voice. Cross-traditional references (Buddhism, Taoism, Vedanta, neuroscience). Intellectual warmth, observer-humor.

HARD RULES for this article:
- 1,600 to 2,000 words (strict)
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze.
- Never use these phrases: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long ones. Some just three words.
- Include at least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting," "Think about it," "That said."
- Concrete specifics over abstractions. A name. A number. A moment.
- No em-dashes. No em-dashes. No em-dashes.

Embed these phrases as <blockquote>: ${phrases.join(' | ')}
Include 2 conversational interjections. Include 1-2 first-person lived experience sentences.
HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists.

MANDATORY AMAZON PRODUCT LINKS (use these verified products):
${productContext}
Include AT LEAST 3 Amazon links in body text + 2-3 in a "Your Healing Journey" section.
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

Return HTML body only.`,
            messages: [{
              role: 'user',
              content: `Rewrite this article: "${article.title}" (category: ${article.categoryName})\n\nCurrent body (first 500 chars): ${(originalBody || '').substring(0, 500)}\n\nReturn ONLY the HTML body.`
            }]
          })
        });

        if (!response.ok) {
          console.warn(`[deep-refresh] API error ${response.status} for article ${article.id}, attempt ${attempt}`);
          continue;
        }

        const data = await response.json();
        let body = data.content[0].text;
        body = body.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        body = body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
        body = body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');

        // ENFORCE: minimum 3 Amazon links
        const amazonCount = (body.match(/amazon\.com\/dp\//g) || []).length;
        if (amazonCount < 3 && catalog.length >= 3) {
          const extra = shuffle(catalog).slice(0, 3 - amazonCount);
          for (let pi = 0; pi < extra.length; pi++) {
            const ep = extra[pi];
            const allP = [...body.matchAll(/<\/p>/g)];
            const insertIdx = Math.floor(allP.length * (0.25 + pi * 0.2));
            if (allP[insertIdx]) {
              const pos = allP[insertIdx].index + 4;
              const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${ep.name}</a> (paid link)`;
              body = body.slice(0, pos) + `\n<p>Many readers have found the ${link} genuinely useful for this.</p>` + body.slice(pos);
            }
          }
        }

        // Run quality gate
        const gate = runQualityGate(body);
        if (gate.passed) {
          passed = true;
          const idx = articles.findIndex(a => a.id === article.id);
          if (idx >= 0) {
            articles[idx].body = body;
            articles[idx].lastDeepRefresh = new Date().toISOString().split('T')[0];
          }
          refreshed++;
          console.log(`[deep-refresh] PASSED: article ${article.id} "${article.title}" (${gate.wordCount} words, ${gate.amazonLinks} links)`);
          break;
        } else {
          console.warn(`[deep-refresh] article ${article.id} attempt ${attempt} FAILED gate:`, gate.failures.join(' | '));
        }
      } catch (e) {
        console.error(`[deep-refresh] Error on article ${article.id} attempt ${attempt}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!passed) {
      console.error(`[deep-refresh] article ${article.id} FAILED gate 3x, keeping original`);
      // Mark as attempted so we don't retry immediately
      const idx = articles.findIndex(a => a.id === article.id);
      if (idx >= 0) articles[idx].lastDeepRefresh = new Date().toISOString().split('T')[0];
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log(`[deep-refresh] Done. Refreshed ${refreshed}/${toRefresh.length} articles`);

  if (GH_PAT) {
    try {
      const { execSync } = await import('child_process');
      execSync(`cd ${ROOT} && git add content/ && git commit -m "90-day deep refresh: ${refreshed} articles" && git push`, {
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
