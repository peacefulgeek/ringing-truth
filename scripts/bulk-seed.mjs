// ─── BULK SEED: Generate 500 articles via DeepSeek V4-Pro ───
// Zero Claude. Zero Fal.ai. Zero GPT.
// Run: DEEPSEEK_API_KEY=xxx node scripts/bulk-seed.mjs
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';
const TARGET_COUNT = parseInt(process.env.BULK_COUNT || '500', 10);

const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';

const CATEGORIES = [
  { slug: 'the-science', name: 'The Science' },
  { slug: 'the-management', name: 'The Management' },
  { slug: 'the-mind', name: 'The Mind' },
  { slug: 'the-body', name: 'The Body' },
  { slug: 'the-deeper-listening', name: 'The Deeper Listening' },
];

const OPENER_TYPES = ['scene-setting', 'provocation', 'first-person', 'question', 'named-reference', 'gut-punch'];

const KALESH_PHRASES = [
  'The mind is not the enemy. The identification with it is.',
  'Awareness does not need to be cultivated. It needs to be uncovered.',
  'The nervous system does not respond to what you believe. It responds to what it senses.',
  'Every resistance is information. The question is whether you are willing to read it.',
  'The gap between stimulus and response is where your entire life lives.',
  'Sit with it long enough and even the worst feeling reveals its edges.',
  'The body remembers what the mind would prefer to file away.',
  'Information without integration is just intellectual hoarding.',
  'You are not a problem to be solved. You are a process to be witnessed.',
  'Stillness is not the absence of noise. It is the presence of attention.',
  'Healing is not a destination. It is a willingness to keep showing up to what is true.',
  'The ear hears sound. Awareness hears the ear.',
  'The ringing is not the problem. Your relationship to the ringing is the problem.',
  'The body whispers before it screams. Most of us only listen to the screams.',
  'Sound is not the enemy. The meaning we assign to sound is where suffering begins.',
];

const INTERJECTIONS = [
  'Stay with me here.', 'I know, I know.', 'Wild, right?',
  'Think about that for a second.', 'Here is what gets interesting.',
  'And this is the part nobody talks about.', 'Bear with me on this one.',
  'Sounds strange, I realize.', 'Stick with this for a moment.',
  'Now here is the thing.', 'Let that land for a second.',
];

const NICHE_RESEARCHERS = [
  'Pawel Jastreboff', 'David Baguley', 'Richard Hallam',
  'Laurence McKenna', 'Josef Rauschecker', 'Susan Shore',
  'Hubert Lim', 'Rilana Cima', 'Berthold Langguth', 'Aage Moller'
];

const SPIRITUAL_RESEARCHERS = [
  'Jiddu Krishnamurti', 'Alan Watts', 'Sam Harris', 'Sadhguru', 'Tara Brach'
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function assignLibraryImage(slug) {
  const libraryIndex = Math.floor(Math.random() * 40) + 1;
  const sourceFile = `library/lib-${String(libraryIndex).padStart(2, '0')}.webp`;
  try {
    const imgBuffer = await fetch(`${BUNNY_CDN_BASE}/${sourceFile}`).then(r => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.arrayBuffer();
    });
    const destHero = `images/${slug}-hero.webp`;
    const destOg = `images/${slug}-og.webp`;
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destHero}`, {
      method: 'PUT', headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destOg}`, {
      method: 'PUT', headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });
    return { heroUrl: `${BUNNY_CDN_BASE}/${destHero}`, ogUrl: `${BUNNY_CDN_BASE}/${destOg}` };
  } catch (e) {
    return { heroUrl: `${BUNNY_CDN_BASE}/images/default-hero.webp`, ogUrl: `${BUNNY_CDN_BASE}/images/default-og.webp` };
  }
}

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.error('[bulk-seed] DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');

  const articlesPath = join(ROOT, 'content/all-articles.json');
  let articles = existsSync(articlesPath) ? JSON.parse(readFileSync(articlesPath, 'utf8')) : [];

  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const products = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];

  const imageMapPath = join(ROOT, 'content/image-map.json');
  let imageMap = existsSync(imageMapPath) ? JSON.parse(readFileSync(imageMapPath, 'utf8')) : {};

  let maxId = articles.reduce((max, a) => Math.max(max, a.id || 0), 0);
  const existingSlugs = new Set(articles.map(a => a.slug));
  let generated = 0;
  let failed = 0;

  console.log(`[bulk-seed] Starting. Current articles: ${articles.length}. Target: +${TARGET_COUNT}`);

  // Backdate articles evenly across last 6 months
  const now = Date.now();
  const sixMonthsAgo = now - (180 * 86400000);

  for (let i = 0; i < TARGET_COUNT; i++) {
    const nextId = maxId + 1;
    const category = CATEGORIES[i % CATEGORIES.length];
    const openerType = OPENER_TYPES[i % OPENER_TYPES.length];
    const faqCount = [0, 2, 2, 2, 3, 3, 3, 4, 4, 5][i % 10];
    const conclusionType = i % 10 < 3 ? 'challenge' : 'tender';
    const selectedPhrases = shuffle(KALESH_PHRASES).slice(0, 4);
    const selectedInterjections = shuffle(INTERJECTIONS).slice(0, 2);
    const nicheRef = shuffle(NICHE_RESEARCHERS).slice(0, 2);
    const spiritRef = shuffle(SPIRITUAL_RESEARCHERS).slice(0, 1);
    const selectedProducts = shuffle(products).slice(0, 6);
    const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

    // Backdate evenly
    const dateOffset = Math.floor((i / TARGET_COUNT) * (now - sixMonthsAgo));
    const dateISO = new Date(sixMonthsAgo + dateOffset).toISOString().split('T')[0];

    let stored = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[bulk-seed] Article ${i + 1}/${TARGET_COUNT} (ID ${nextId}), attempt ${attempt}/3...`);

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'deepseek-v4-pro',
            max_tokens: 4096,
            messages: [
              {
                role: 'system',
                content: `You are Kalesh, a consciousness teacher and writer for The Ringing Truth (tinnitus wellness).

VOICE RULES:
- Write in long, unfolding sentences that build and turn (18-28 words average)
- Write 3-4 flowing sentences before dropping a short one like a stone
- Cross-traditional references (Buddhism, Taoism, Vedanta, neuroscience)
- Intellectual warmth, observer-humor
- Use "we" and "one" more than "you"
- Conversational markers: "How does that make you feel?", "Right?!", "Know what I mean?"

HUMANIZATION:
- Include 2 conversational interjections: ${selectedInterjections.join(' | ')}
- Include 1-2 first-person lived experience sentences
- Reference these researchers naturally: ${nicheRef.join(', ')} and ${spiritRef.join(', ')}
- Embed 3-4 of these Kalesh phrases as <blockquote>: ${selectedPhrases.join(' | ')}

STRUCTURE:
- Opener type: ${openerType}
- 5-7 H2 sections, each 2-4 paragraphs
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists
- FAQ count: ${faqCount}
- Conclusion type: ${conclusionType}
- Include a "Your Healing Journey" section with 2-3 Amazon product recommendations

MANDATORY AMAZON PRODUCT LINKS (MINIMUM 3 in body + Healing Journey):
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

HARD RULES:
- 1,600 to 2,000 words (strict)
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use these words: delve, tapestry, paradigm, synergy, leverage, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, beacon, foster, curate, curated, bespoke, harness, plethora, myriad, transformative, groundbreaking, cutting-edge, revolutionary, state-of-the-art, ever-evolving, multifaceted, stakeholders, ecosystem, streamline, catalyze, unveil, unravel, demystify, elucidate, spearhead, orchestrate, underpinning, overarching, interplay, juxtaposition, dichotomy, amalgamation, confluence.
- Never use these phrases: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long ones. Some just three words.
- No em-dashes. No em-dashes. No em-dashes.

Output valid JSON: {title, slug, body (HTML), metaDescription (155 chars), faqCount, faqs [{question, answer}]}`
              },
              {
                role: 'user',
                content: `Write a new article for the "${category.name}" category about tinnitus. Pick an original, specific topic that hasn't been covered. Return valid JSON only.`
              }
            ]
          })
        });

        if (!response.ok) {
          console.error(`[bulk-seed] DeepSeek API error: ${response.status}`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        let article;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          article = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('[bulk-seed] Failed to parse JSON, retrying...');
          continue;
        }

        // Deduplicate slug
        if (existingSlugs.has(article.slug)) {
          article.slug = article.slug + '-' + nextId;
        }

        // Post-processing: strip em-dashes and banned words
        if (article.body) {
          article.body = article.body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
          article.body = article.body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');
          // Auto-replace common AI words that slip through
          const replacements = [
            [/\bdelve\b/gi, 'explore'], [/\btapestry\b/gi, 'mix'],
            [/\bparadigm\b/gi, 'model'], [/\bsynergy\b/gi, 'connection'],
            [/\bleverage\b/gi, 'use'], [/\bempower\b/gi, 'support'],
            [/\butilize\b/gi, 'use'], [/\bpivotal\b/gi, 'key'],
            [/\bembark\b/gi, 'start'], [/\bunderscore\b/gi, 'highlight'],
            [/\bparamount\b/gi, 'critical'], [/\bseamlessly\b/gi, 'smoothly'],
            [/\bbeacon\b/gi, 'signal'], [/\bfoster\b/gi, 'build'],
            [/\bcurated?\b/gi, 'selected'], [/\bbespoke\b/gi, 'custom'],
            [/\bharness\b/gi, 'use'], [/\bplethora\b/gi, 'range'],
            [/\bmyriad\b/gi, 'many'], [/\btransformative\b/gi, 'powerful'],
            [/\bgroundbreaking\b/gi, 'new'], [/\bmultifaceted\b/gi, 'complex'],
            [/\bstakeholders\b/gi, 'people involved'], [/\becosystem\b/gi, 'system'],
            [/\bstreamline\b/gi, 'simplify'], [/\bcatalyze\b/gi, 'trigger'],
            [/\bunveil\b/gi, 'show'], [/\bunravel\b/gi, 'untangle'],
            [/\bdemystify\b/gi, 'clarify'], [/\belucidate\b/gi, 'explain'],
            [/\bspearhead\b/gi, 'lead'], [/\borchestrate\b/gi, 'arrange'],
            [/\boverarching\b/gi, 'main'], [/\bconfluence\b/gi, 'meeting point'],
          ];
          for (const [re, rep] of replacements) {
            article.body = article.body.replace(re, rep);
          }
        }

        // Enforce 3+ Amazon links
        if (article.body) {
          const amazonCount = (article.body.match(/amazon\.com\/dp\//g) || []).length;
          if (amazonCount < 3 && products.length >= 3) {
            const extra = shuffle(products).slice(0, 3 - amazonCount);
            let body = article.body;
            const pTags = [...body.matchAll(/<\/p>/g)];
            if (pTags.length >= 4) {
              for (let pi = 0; pi < extra.length; pi++) {
                const ep = extra[pi];
                const allP = [...body.matchAll(/<\/p>/g)];
                const insertPos = Math.floor(allP.length * (0.25 + pi * 0.25));
                if (allP[insertPos]) {
                  const idx = allP[insertPos].index + 4;
                  const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${ep.name}</a> (paid link)`;
                  body = body.slice(0, idx) + `\n<p>${ep.sentence || 'Many readers have found this helpful'}. The ${link} is genuinely useful for this.</p>` + body.slice(idx);
                }
              }
              article.body = body;
            }
          }
        }

        // Quality gate
        const gate = runQualityGate(article.body || '');
        if (!gate.passed) {
          console.warn(`[bulk-seed] Attempt ${attempt} failed gate:`, gate.failures.join(' | '));
          if (attempt < 3) continue;
          failed++;
          break;
        }

        // Set metadata
        article.id = nextId;
        article.category = category.slug;
        article.categoryName = category.name;
        article.dateISO = dateISO;
        article.readingTime = Math.ceil((article.body || '').replace(/<[^>]+>/g, '').split(/\s+/).length / 250);
        article.openerType = openerType;
        article.conclusionType = conclusionType;

        // Assign library image
        const imageUrls = await assignLibraryImage(article.slug);
        imageMap[article.slug] = imageUrls;

        articles.push(article);
        existingSlugs.add(article.slug);
        maxId = nextId;
        generated++;
        stored = true;

        console.log(`[bulk-seed] ✓ ${generated}/${TARGET_COUNT}: "${article.title}" (${gate.wordCount} words, ${gate.amazonLinks} links)`);

        // Save every 10 articles
        if (generated % 10 === 0) {
          writeFileSync(articlesPath, JSON.stringify(articles));
          writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));
          console.log(`[bulk-seed] Checkpoint saved at ${generated} articles`);
        }

        break;
      } catch (err) {
        console.error(`[bulk-seed] Error: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!stored) {
      console.warn(`[bulk-seed] Skipping article ${i + 1} after 3 failed attempts`);
    }

    // Rate limiting: 1 second between articles
    await new Promise(r => setTimeout(r, 1000));
  }

  // Final save
  writeFileSync(articlesPath, JSON.stringify(articles));
  writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));

  console.log(`[bulk-seed] DONE. Generated: ${generated}, Failed: ${failed}, Total articles: ${articles.length}`);
}

main().catch(err => {
  console.error('[bulk-seed] Fatal error:', err);
  process.exit(1);
});
