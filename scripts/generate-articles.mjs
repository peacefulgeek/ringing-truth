// ─── DEEPSEEK V4-PRO ARTICLE GENERATION ───
// Zero Claude. Zero Fal.ai. Zero GPT. DeepSeek only.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GH_PAT = process.env.GH_PAT;
const AUTO_GEN_ENABLED = process.env.AUTO_GEN_ENABLED === 'true';

// ─── BUNNY CDN (safe to hardcode) ───
const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';
const GITHUB_REPO = 'peacefulgeek/ringing-truth';
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';

// ─── SITE CONFIG ───
const SITE_NAME = 'The Ringing Truth';
const SITE_DOMAIN = 'ringingtruth.com';
const AUTHOR_NAME = 'Kalesh';
const AUTHOR_TITLE = 'Consciousness Teacher & Writer';
const AUTHOR_LINK = 'https://kalesh.love';
const EDITORIAL_NAME = 'The Ringing Truth Editorial';

const CATEGORIES = [
  { slug: 'the-science', name: 'The Science' },
  { slug: 'the-management', name: 'The Management' },
  { slug: 'the-mind', name: 'The Mind' },
  { slug: 'the-body', name: 'The Body' },
  { slug: 'the-deeper-listening', name: 'The Deeper Listening' },
];

const EXTERNAL_AUTHORITY_SITES = [
  'https://www.ata.org', 'https://www.ncbi.nlm.nih.gov',
  'https://www.mayoclinic.org', 'https://www.nidcd.nih.gov',
  'https://www.asha.org', 'https://www.health.harvard.edu',
  'https://pubmed.ncbi.nlm.nih.gov', 'https://www.bta.org.uk',
];

const NICHE_RESEARCHERS = [
  'Pawel Jastreboff', 'David Baguley', 'Richard Hallam',
  'Laurence McKenna', 'Josef Rauschecker', 'Susan Shore',
  'Hubert Lim', 'Rilana Cima', 'Berthold Langguth', 'Aage Moller'
];

const SPIRITUAL_RESEARCHERS = [
  'Jiddu Krishnamurti', 'Alan Watts', 'Sam Harris', 'Sadhguru', 'Tara Brach'
];

const KALESH_PHRASES = [
  'The mind is not the enemy. The identification with it is.',
  'Most of what passes for healing is just rearranging the furniture in a burning house.',
  'Awareness does not need to be cultivated. It needs to be uncovered.',
  'The nervous system does not respond to what you believe. It responds to what it senses.',
  'You cannot think your way into a felt sense of safety. The body has its own logic.',
  'Every resistance is information. The question is whether you are willing to read it.',
  'What we call stuck is usually the body doing exactly what it was designed to do under conditions that no longer exist.',
  'The gap between stimulus and response is where your entire life lives.',
  'Consciousness does not arrive. It is what is left when everything else quiets down.',
  'The body keeps the score, but it also keeps the wisdom. We just rarely ask.',
  'Stillness is not the absence of noise. It is the presence of attention.',
  'Healing is not a destination. It is a willingness to keep showing up to what is true.',
  'The ear hears sound. Awareness hears the ear.',
  'What you resist does not go away. It goes underground and runs the show from there.',
  'There is a difference between managing symptoms and understanding what the symptoms are saying.',
  'The nervous system does not lie. It simply reports what it has learned.',
  'Silence is not empty. It is full of answers.',
  'The moment you stop fighting the noise, something unexpected happens. You start hearing what is underneath it.',
  'Peace is not the absence of disturbance. It is the ability to remain present within it.',
  'We do not hear with our ears alone. We hear with our entire history.',
  'The brain is not broken. It is doing exactly what it was trained to do. The question is whether we can retrain it.',
  'Attention is the most powerful medicine we have. And it costs nothing.',
  'What we call anxiety is often just the nervous system doing its job too well.',
  'The difference between suffering and pain is the story we wrap around it.',
  'You do not need to fix yourself. You need to understand yourself.',
  'The body whispers before it screams. Most of us only listen to the screams.',
  'Meditation is not about stopping thoughts. It is about changing your relationship to them.',
  'The ringing is not the problem. Your relationship to the ringing is the problem.',
  'Every sensation is temporary. Even the ones that feel permanent.',
  'The mind wants certainty. The body wants safety. Wisdom lives in the space between.',
  'You are not your thoughts. You are not your symptoms. You are the awareness that notices both.',
  'The most radical thing you can do is pay attention without trying to change anything.',
  'Healing happens in the present tense. Not in the future you are planning for.',
  'The nervous system remembers what the conscious mind forgets.',
  'Sound is not the enemy. The meaning we assign to sound is where suffering begins.',
  'There is intelligence in the body that the mind cannot comprehend.',
  'Rest is not laziness. It is the foundation of all genuine recovery.',
  'The ear does not have an off switch. But attention does.',
  'What if the ringing is not a malfunction but a message?',
  'We spend so much energy fighting what is that we forget to explore what could be.',
  'The breath is always available. It asks nothing of you except your attention.',
  'Acceptance is not resignation. It is the doorway to genuine change.',
  'The brain can learn to turn down the volume. But first, it needs to feel safe enough to try.',
  'There is a quiet place inside every person that the noise cannot reach.',
  'The path forward is not always forward. Sometimes it is inward.',
  'Tinnitus teaches you something most people never learn: how to be present with discomfort.',
  'The mind creates problems. Awareness dissolves them.',
  'What you pay attention to grows. Choose wisely.',
  'The body is not a machine to be fixed. It is a living system to be understood.',
  'At a certain depth of inquiry, the distinction between psychology and philosophy dissolves entirely.',
];

const OPENER_TYPES = ['scene-setting', 'provocation', 'first-person', 'question', 'named-reference', 'gut-punch'];
const INTERJECTIONS = [
  'Stay with me here.', 'I know, I know.', 'Wild, right?',
  'Think about that for a second.', 'Here is what gets interesting.',
  'And this is the part nobody talks about.', 'Bear with me on this one.',
  'Sounds strange, I realize.', 'Stick with this for a moment.',
  'Now here is the thing.', 'Let that land for a second.',
  'I get it. Really, I do.', 'Hang on, because this matters.',
  'This part surprised me too.', 'Worth sitting with, that one.',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Import quality gate
async function loadQualityGate() {
  const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');
  return runQualityGate;
}

// ─── BUNNY CDN IMAGE LIBRARY ROTATION ───
async function assignLibraryImage(slug) {
  // Pick a random image from /library/ (1-40) and duplicate it as the article's hero
  const libraryIndex = Math.floor(Math.random() * 40) + 1;
  const sourceFile = `library/lib-${String(libraryIndex).padStart(2, '0')}.webp`;
  const destHero = `images/${slug}-hero.webp`;
  const destOg = `images/${slug}-og.webp`;

  try {
    // Fetch the library image from Bunny CDN
    const sourceUrl = `${BUNNY_CDN_BASE}/${sourceFile}`;
    const imgBuffer = await fetch(sourceUrl).then(r => {
      if (!r.ok) throw new Error(`Library image fetch failed: ${r.status}`);
      return r.arrayBuffer();
    });

    // Upload as hero image
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destHero}`, {
      method: 'PUT',
      headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });

    // Upload as OG image
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destOg}`, {
      method: 'PUT',
      headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });

    console.log(`[generate] Images assigned from library/${sourceFile} → ${slug}`);
    return {
      heroUrl: `${BUNNY_CDN_BASE}/${destHero}`,
      ogUrl: `${BUNNY_CDN_BASE}/${destOg}`
    };
  } catch (e) {
    console.error(`[generate] Image assignment failed: ${e.message}`);
    return {
      heroUrl: `${BUNNY_CDN_BASE}/images/default-hero.webp`,
      ogUrl: `${BUNNY_CDN_BASE}/images/default-og.webp`
    };
  }
}

async function main() {
  if (!AUTO_GEN_ENABLED) {
    console.log('[generate] AUTO_GEN_ENABLED is not true. Exiting.');
    process.exit(0);
  }

  console.log('[generate] Starting article generation with DeepSeek V4-Pro...');

  if (!DEEPSEEK_API_KEY) {
    console.error('[generate] DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  const runQualityGate = await loadQualityGate();

  // Load existing articles
  const articlesPath = join(ROOT, 'content/all-articles.json');
  let articles = [];
  if (existsSync(articlesPath)) {
    articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  }

  // Load product catalog for Amazon links
  const catalogPath = join(ROOT, 'content/product-catalog.json');
  let products = [];
  if (existsSync(catalogPath)) {
    products = JSON.parse(readFileSync(catalogPath, 'utf8'));
  }

  const maxId = articles.reduce((max, a) => Math.max(max, a.id || 0), 0);
  const nextId = maxId + 1;
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const openerType = OPENER_TYPES[Math.floor(Math.random() * OPENER_TYPES.length)];
  const faqCount = [0, 2, 2, 2, 3, 3, 3, 4, 4, 5][Math.floor(Math.random() * 10)];
  const conclusionType = Math.random() < 0.3 ? 'challenge' : 'tender';
  const selectedPhrases = shuffle(KALESH_PHRASES).slice(0, 4);
  const selectedInterjections = shuffle(INTERJECTIONS).slice(0, 2);
  const nicheRef = shuffle(NICHE_RESEARCHERS).slice(0, 2);
  const spiritRef = shuffle(SPIRITUAL_RESEARCHERS).slice(0, 1);
  const selectedProducts = shuffle(products).slice(0, 6);

  const productContext = selectedProducts.map(p =>
    `${p.name} (ASIN: ${p.asin}, sentence: "${p.sentence || ''}")`
  ).join('\n');

  // ─── GENERATION LOOP WITH QUALITY GATE (3 attempts) ───
  let stored = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[generate] Attempt ${attempt}/3...`);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: `You are Kalesh, a consciousness teacher and writer for ${SITE_NAME} (tinnitus wellness).

VOICE RULES:
- Write in long, unfolding sentences that build and turn (18-28 words average)
- Write 3-4 flowing sentences before dropping a short one like a stone
- Cross-traditional references (Buddhism, Taoism, Vedanta, neuroscience)
- Intellectual warmth, observer-humor
- Use "we" and "one" more than "you"
- Build analogies across 2-3 sentences before revealing the point
- No two consecutive sentences should start the same way
- Conversational markers: "How does that make you feel?", "Right?!", "Know what I mean?"
- Sit beside the reader in their pain (Tender Guide register)

HUMANIZATION:
- Include 2 conversational interjections: ${selectedInterjections.join(' | ')}
- Include 1-2 first-person lived experience sentences
- Reference these researchers naturally: ${nicheRef.join(', ')} (niche) and ${spiritRef.join(', ')} (spiritual)
- Embed 3-4 of these Kalesh phrases as <blockquote>: ${selectedPhrases.join(' | ')}

STRUCTURE:
- Opener type: ${openerType}
- 5-7 H2 sections, each 2-4 paragraphs
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists
- FAQ count: ${faqCount} (if 0, no FAQ section)
- Conclusion type: ${conclusionType} (challenge = provocation/uncomfortable question, tender = earned warmth)
- Include a "Your Healing Journey" section before FAQs with 2-3 Amazon product recommendations

MANDATORY AMAZON PRODUCT LINKS (MINIMUM 3 in body text + Healing Journey section):
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

RULES FOR AMAZON LINKS:
1. You MUST include AT LEAST 3 Amazon product links woven naturally into the article body paragraphs
2. Each inline link should recommend a product that genuinely relates to the paragraph topic
3. Use natural phrasing like "Many people find the [Product Link] (paid link) helpful for this"
4. THEN also include a "Your Healing Journey: Tools Worth Exploring" section near the end with 2-3 more product links
5. Total Amazon links in the article should be 5-6
6. Every single link MUST include ?tag=${AMAZON_TAG} and the text "(paid link)" after it

HARD RULES for this article:
- 1,600 to 2,000 words (strict)
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze, landscape, framework.
- Never use these phrases: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long ones that stretch across a full breath. Some just three words.
- Direct address ("you") throughout OR first-person ("I / my") throughout. Pick one.
- Include at least 2 conversational openers somewhere in the piece: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting," "Think about it," "That said."
- Concrete specifics over abstractions. A name. A number. A moment.
- 3 to 4 Amazon product links embedded naturally in prose, each followed by "(paid link)" in plain text.
- No em-dashes. No em-dashes. No em-dashes.

Output valid JSON: {title, slug, body (HTML), metaDescription (155 chars), heroImagePrompt (2-3 sentence scene description), faqCount, faqs [{question, answer}]}`
          },
          {
            role: 'user',
            content: `Write a new article for the "${category.name}" category about tinnitus. Pick an original, specific topic. Return valid JSON only.`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error(`[generate] DeepSeek API error: ${response.status}`);
      continue;
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    let article;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      article = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[generate] Failed to parse article JSON, retrying...');
      continue;
    }

    // Post-processing: remove any emdashes that slipped through
    if (article.body) {
      article.body = article.body.replace(/\u2014/g, ', ');
      article.body = article.body.replace(/\u2013/g, ', ');
      article.body = article.body.replace(/&mdash;/g, ', ');
      article.body = article.body.replace(/&ndash;/g, ', ');
    }

    // ENFORCE: minimum 3 Amazon links in body
    if (article.body) {
      const amazonLinkCount = (article.body.match(/amazon\.com\/dp\//g) || []).length;
      if (amazonLinkCount < 3 && products.length >= 3) {
        console.log(`[generate] Only ${amazonLinkCount} Amazon links found, injecting more...`);
        const extraProducts = shuffle(products).slice(0, 3 - amazonLinkCount);
        const pTags = [...article.body.matchAll(/<\/p>/g)];
        let body = article.body;
        if (pTags.length >= 4) {
          for (let pi = 0; pi < extraProducts.length; pi++) {
            const ep = extraProducts[pi];
            const insertPos = Math.floor(pTags.length * (0.25 + pi * 0.25));
            const allP = [...body.matchAll(/<\/p>/g)];
            if (allP[insertPos]) {
              const idx = allP[insertPos].index + 4;
              const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${ep.name}</a> (paid link)`;
              const injection = `\n<p>${ep.sentence || 'Many readers have found this helpful'}. The ${link} is genuinely useful for this.</p>`;
              body = body.slice(0, idx) + injection + body.slice(idx);
            }
          }
          article.body = body;
        }
      }
    }

    // ─── QUALITY GATE CHECK ───
    const gate = runQualityGate(article.body || '');
    if (!gate.passed) {
      console.warn(`[generate] Attempt ${attempt} failed quality gate:`, gate.failures.join(' | '));
      if (attempt < 3) continue;
      console.error('[generate] Abandoned after 3 attempts. NOT storing broken article.');
      process.exit(0);
    }

    console.log(`[generate] Quality gate PASSED (${gate.wordCount} words, ${gate.amazonLinks} links)`);

    // Set metadata
    article.id = nextId;
    article.category = category.slug;
    article.categoryName = category.name;
    article.dateISO = new Date().toISOString().split('T')[0];
    article.readingTime = Math.ceil((article.body || '').split(/\s+/).length / 250);
    article.openerType = openerType;
    article.conclusionType = conclusionType;

    // ─── BUNNY CDN IMAGE LIBRARY ROTATION (no Fal.ai) ───
    const imageUrls = await assignLibraryImage(article.slug);

    // Update image map
    const imageMapPath = join(ROOT, 'content/image-map.json');
    let imageMap = {};
    if (existsSync(imageMapPath)) {
      imageMap = JSON.parse(readFileSync(imageMapPath, 'utf8'));
    }
    imageMap[article.slug] = imageUrls;
    writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));

    // Add to articles array
    articles.push(article);
    writeFileSync(articlesPath, JSON.stringify(articles));

    console.log(`[generate] Article ${nextId} stored: ${article.title} (${gate.wordCount} words, ${gate.amazonLinks} links)`);
    stored = true;

    // Push to GitHub
    if (GH_PAT) {
      try {
        const { execSync } = await import('child_process');
        execSync(`cd ${ROOT} && git add content/ && git commit -m "Auto-gen article ${nextId}: ${article.slug}" && git push`, {
          stdio: 'inherit',
          env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
        });
        console.log('[generate] Pushed to GitHub');
      } catch (e) {
        console.error('[generate] Git push failed:', e.message);
      }
    }

    break; // Success, exit the loop
  }

  if (!stored) {
    console.error('[generate] No article stored after all attempts');
  }
}

main().catch(err => {
  console.error('[generate] Fatal error:', err);
  process.exit(1);
});
