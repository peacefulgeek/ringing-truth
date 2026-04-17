// Saturday product spotlight: generates a product-focused article with quality gate
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const AUTO_GEN_ENABLED = process.env.AUTO_GEN_ENABLED === 'true';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FAL_KEY = process.env.FAL_API_KEY;
const GH_PAT = process.env.GH_PAT;
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';

const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';

const SITE_NAME = 'The Ringing Truth';
const AUTHOR_NAME = 'Kalesh';
const EDITORIAL_NAME = 'The Ringing Truth Editorial';

const PRODUCT_CATEGORIES = [
  'sound-machines-and-masking',
  'hearing-protection',
  'noise-cancelling-headphones',
  'sleep-aids-for-tinnitus',
  'mindfulness-and-meditation-tools',
  'supplements-for-auditory-health',
  'body-work-and-tension-relief',
  'books-on-tinnitus-and-consciousness',
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
  if (!AUTO_GEN_ENABLED) {
    console.log('[product-spotlight] AUTO_GEN_ENABLED is false. Exiting.');
    process.exit(0);
  }
  if (!ANTHROPIC_API_KEY) {
    console.log('[product-spotlight] No ANTHROPIC_API_KEY set. Exiting.');
    process.exit(0);
  }

  const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');

  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  const nextId = articles.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
  const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
  const dateISO = new Date().toISOString().split('T')[0];

  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];
  const selectedProducts = shuffle(catalog).slice(0, 8);
  const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

  console.log(`[product-spotlight] Generating article #${nextId} for category: ${category}`);

  let stored = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[product-spotlight] Attempt ${attempt}/3...`);

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
          system: `You are Kalesh, a consciousness teacher and writer for ${SITE_NAME} (tinnitus wellness).

VOICE RULES:
- Write in long, unfolding sentences that build and turn (18-28 words average)
- Write 3-4 flowing sentences before dropping a short one like a stone
- Cross-traditional references (Buddhism, Taoism, Vedanta, neuroscience)
- Intellectual warmth, observer-humor
- Use "we" and "one" more than "you"

HARD RULES:
- 1,600 to 2,000 words (strict)
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze.
- Never use these phrases: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long ones. Some just three words.
- Include at least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting."
- Concrete specifics over abstractions. A name. A number. A moment.
- No em-dashes. No em-dashes. No em-dashes.
- Include 2 conversational interjections. Include 1-2 first-person lived experience sentences.
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists.

MANDATORY AMAZON PRODUCT LINKS (use these verified products):
${productContext}
Include AT LEAST 3 Amazon links in body text + 2-3 in a "Your Healing Journey" section.
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

Output valid JSON: {title, slug, body (HTML), metaDescription (155 chars), heroImagePrompt (2-3 sentence scene description), faqs [{question, answer}]}`,
          messages: [{
            role: 'user',
            content: `Write a product spotlight article about ${category.replace(/-/g, ' ')} for tinnitus management. Return valid JSON only.`
          }]
        })
      });

      if (!response.ok) {
        console.warn(`[product-spotlight] API error ${response.status}, attempt ${attempt}`);
        continue;
      }

      const data = await response.json();
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { console.warn('[product-spotlight] No JSON found'); continue; }

      const article = JSON.parse(jsonMatch[0]);

      // Post-processing: remove emdashes
      if (article.body) {
        article.body = article.body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
        article.body = article.body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');
      }

      // ENFORCE: minimum 3 Amazon links
      if (article.body) {
        const amazonCount = (article.body.match(/amazon\.com\/dp\//g) || []).length;
        if (amazonCount < 3 && catalog.length >= 3) {
          const extra = shuffle(catalog).slice(0, 3 - amazonCount);
          let body = article.body;
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
          article.body = body;
        }
      }

      // Quality gate
      const gate = runQualityGate(article.body || '');
      if (!gate.passed) {
        console.warn(`[product-spotlight] Attempt ${attempt} failed gate:`, gate.failures.join(' | '));
        if (attempt < 3) continue;
        console.error('[product-spotlight] Abandoned after 3 attempts.');
        process.exit(0);
      }

      console.log(`[product-spotlight] Quality gate PASSED (${gate.wordCount} words, ${gate.amazonLinks} links)`);

      // Set metadata
      article.id = nextId;
      article.dateISO = dateISO;
      article.category = 'the-management';
      article.categoryName = 'The Management';
      article.readingTime = Math.ceil((article.body || '').replace(/<[^>]+>/g, '').split(/\s+/).length / 250);
      article.hasAffiliateLink = true;
      article.linkType = 'product';
      article.isProductSpotlight = true;
      article.openerType = 'scene-setting';
      article.conclusionType = 'tender';

      // Generate hero image
      if (FAL_KEY && article.heroImagePrompt) {
        try {
          const imgResponse = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
            method: 'POST',
            headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: article.heroImagePrompt + ' Luminous, warm, healing light. No text. No dark environments.',
              image_size: { width: 1200, height: 675 }, num_images: 1
            })
          });
          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            const imageUrl = imgData.images?.[0]?.url;
            if (imageUrl) {
              const imgBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
              await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/images/${article.slug}-hero.webp`, {
                method: 'PUT',
                headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
                body: Buffer.from(imgBuffer)
              });
              await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/images/${article.slug}-og.png`, {
                method: 'PUT',
                headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/png' },
                body: Buffer.from(imgBuffer)
              });
              // Update image map
              const imageMapPath = join(ROOT, 'content/image-map.json');
              let imageMap = existsSync(imageMapPath) ? JSON.parse(readFileSync(imageMapPath, 'utf8')) : {};
              imageMap[article.slug] = {
                heroUrl: `${BUNNY_CDN_BASE}/images/${article.slug}-hero.webp`,
                ogUrl: `${BUNNY_CDN_BASE}/images/${article.slug}-og.png`
              };
              writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));
              console.log(`[product-spotlight] Images uploaded for ${article.slug}`);
            }
          }
        } catch (e) {
          console.error('[product-spotlight] Image generation failed:', e.message);
        }
      }

      articles.push(article);
      writeFileSync(articlesPath, JSON.stringify(articles));
      stored = true;
      console.log(`[product-spotlight] Article ${nextId} stored: ${article.title}`);

      if (GH_PAT) {
        try {
          const { execSync } = await import('child_process');
          execSync(`cd ${ROOT} && git add content/ && git commit -m "Product spotlight: ${article.slug}" && git push`, {
            stdio: 'inherit',
            env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
          });
          console.log('[product-spotlight] Pushed to GitHub.');
        } catch (e) {
          console.error('[product-spotlight] Git push failed:', e.message);
        }
      }

      break;
    } catch (err) {
      console.error(`[product-spotlight] Attempt ${attempt} error:`, err.message);
    }
  }

  if (!stored) console.error('[product-spotlight] No article stored after all attempts');
}

main().catch(err => {
  console.error('[product-spotlight] Fatal error:', err);
  process.exit(1);
});
