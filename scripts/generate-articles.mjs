// ─── FEATURE FLAG ───
const AUTO_GEN_ENABLED = true;

// ─── FROM RENDER ENV VARS ───
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FAL_KEY = process.env.FAL_API_KEY;
const GH_PAT = process.env.GH_PAT;

// ─── HARDCODED (Bunny is safe in code) ───
const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';
const GITHUB_REPO = 'peacefulgeek/ringing-truth';
const AMAZON_TAG = 'spankyspinola-20';

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

// Full Kalesh 50-phrase library
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
  'The brain is prediction machinery. Anxiety is just prediction running without a stop button.',
  'There is no version of growth that does not involve the dissolution of something you thought was permanent.',
  'Trauma reorganizes perception. Recovery reorganizes it again, but this time with your participation.',
  'The contemplative traditions all point to the same thing: what you are looking for is what is looking.',
  'Embodiment is not a technique. It is what happens when you stop living exclusively in your head.',
  'The space between knowing something intellectually and knowing it in your body is where all the real work happens.',
  'Most people do not fear change. They fear the gap between who they were and who they have not become yet.',
  'Attention is the most undervalued resource you have. Everything else follows from where you place it.',
  'The question is never whether the pain will come. The question is whether you will meet it with presence or with narrative.',
  'Sit with it long enough and even the worst feeling reveals its edges.',
  'There is a difference between being alone and being with yourself. One is circumstance. The other is practice.',
  'Silence is not the absence of noise. It is the presence of attention.',
  'The breath does not need your management. It needs your companionship.',
  'When you stop trying to fix the moment, something remarkable happens - the moment becomes workable.',
  'We are not our thoughts, but we are responsible for our relationship to them.',
  'The body remembers what the mind would prefer to file away.',
  'Patience is not passive. It is the active practice of allowing something to unfold at its own pace.',
  'The paradox of acceptance is that nothing changes until you stop demanding that it does.',
  'What if the restlessness is not a problem to solve but a signal to follow?',
  'You do not arrive at peace. You stop walking away from it.',
  'The most sophisticated defense mechanism is the one that looks like wisdom.',
  'Stillness is not something you achieve. It is what is already here beneath the achieving.',
  'Every moment of genuine attention is a small act of liberation.',
  'Information without integration is just intellectual hoarding.',
  'Your nervous system does not care about your philosophy. It cares about what happened at three years old.',
  'Reading about meditation is to meditation what reading the menu is to eating.',
  'Not every insight requires action. Some just need to be witnessed.',
  'The wellness industry sells solutions to problems it helps you believe you have.',
  'Complexity is the ego is favorite hiding place.',
  'If your spiritual practice makes you more rigid, it is not working.',
  'The research is clear on this, and it contradicts almost everything popular culture teaches.',
  'There is a meaningful difference between self-improvement and self-understanding. One adds. The other reveals.',
  'The algorithm of your attention determines the landscape of your experience.',
  'Stop pathologizing normal human suffering. Not everything requires a diagnosis.',
  'The body has a grammar. Most of us never learned to read it.',
  'You are not a problem to be solved. You are a process to be witnessed.',
  'Freedom is not the absence of constraint. It is the capacity to choose your relationship to it.',
  'The self you are trying to improve is the same self doing the improving. Notice the circularity.',
  'What we call the present moment is not a place you go. It is the only place you have ever been.',
  'The most important things in life cannot be understood - only experienced.',
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

const BANNED_WORDS_NOTE = `ABSOLUTELY BANNED (zero tolerance):
- Em dash character. Use commas, periods, or parentheses instead. Never the long dash.
- Words: profound, transformative, holistic, nuanced, multifaceted, manifest, manifestation, lean into, showing up for, authentic self, safe space, hold space, sacred container, raise your vibration
- Sentence starters: "This is where", "This is", "This means", "This creates" (vary your transitions)
- Endings: "Be gentle with yourself", "Be patient with yourself", "You are not alone", "Trust the process", "Give yourself grace", "Take it one day at a time"`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function main() {
  if (!AUTO_GEN_ENABLED) {
    console.log('[generate] AUTO_GEN_ENABLED is false. Exiting.');
    process.exit(0);
  }

  console.log('[generate] Starting article generation with humanization rules...');

  if (!ANTHROPIC_API_KEY) {
    console.error('[generate] ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

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
  const selectedProducts = shuffle(products).slice(0, 3);

  const productContext = selectedProducts.map(p =>
    `${p.name} (ASIN: ${p.asin}, sentence: "${p.sentence}")`
  ).join('\n');

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
- Build analogies across 2-3 sentences before revealing the point
- Aggressively vary sentence lengths: mix 5-word with 30-word sentences
- No two consecutive sentences should start the same way

${BANNED_WORDS_NOTE}

HUMANIZATION:
- Include 2 conversational interjections: ${selectedInterjections.join(' | ')}
- Include 1-2 first-person lived experience sentences
- Reference these researchers naturally: ${nicheRef.join(', ')} (niche) and ${spiritRef.join(', ')} (spiritual)
- Embed 3-4 of these Kalesh phrases as <blockquote>: ${selectedPhrases.join(' | ')}

STRUCTURE:
- Opener type: ${openerType}
- Word count: 1200-1800 words (strict)
- 5-7 H2 sections, each 2-4 paragraphs
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists
- FAQ count: ${faqCount} (if 0, no FAQ section)
- Conclusion type: ${conclusionType} (challenge = provocation/uncomfortable question, tender = earned warmth)
- Include a "Your Healing Journey" section before FAQs with 2-3 Amazon product recommendations

AMAZON PRODUCTS (use tag=${AMAZON_TAG}):
${productContext}
Format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow noopener">Product Name</a> (paid link)

Also inject 1-2 inline product mentions naturally in the body.

Output valid JSON: {title, slug, body (HTML), metaDescription (155 chars), heroImagePrompt (2-3 sentence scene description), faqCount, faqs [{question, answer}]}`,
      messages: [{
        role: 'user',
        content: `Write a new article for the "${category.name}" category about tinnitus. Pick an original, specific topic. Return valid JSON only.`
      }]
    })
  });

  if (!response.ok) {
    console.error('[generate] Anthropic API error:', response.status);
    process.exit(1);
  }

  const data = await response.json();
  const text = data.content[0].text;

  let article;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    article = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[generate] Failed to parse article JSON');
    process.exit(1);
  }

  // Post-processing: remove any emdashes that slipped through
  if (article.body) {
    article.body = article.body.replace(/\u2014/g, ' - ');
    article.body = article.body.replace(/\u2013/g, ' - ');
  }

  // Set metadata
  article.id = nextId;
  article.category = category.slug;
  article.categoryName = category.name;
  article.dateISO = new Date().toISOString().split('T')[0];
  article.readingTime = Math.ceil((article.body || '').split(/\s+/).length / 250);
  article.openerType = openerType;
  article.conclusionType = conclusionType;

  // Generate hero image via FAL.ai
  if (FAL_KEY && article.heroImagePrompt) {
    try {
      const imgResponse = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: article.heroImagePrompt + ' Luminous, warm, healing light. No text. No dark environments.',
          image_size: { width: 1200, height: 675 },
          num_images: 1
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

          console.log(`[generate] Image uploaded for ${article.slug}`);
        }
      }
    } catch (e) {
      console.error('[generate] Image generation failed:', e.message);
    }
  }

  // Update image map
  const imageMapPath = join(ROOT, 'content/image-map.json');
  let imageMap = {};
  if (existsSync(imageMapPath)) {
    imageMap = JSON.parse(readFileSync(imageMapPath, 'utf8'));
  }
  imageMap[article.slug] = {
    heroUrl: `${BUNNY_CDN_BASE}/images/${article.slug}-hero.webp`,
    ogUrl: `${BUNNY_CDN_BASE}/images/${article.slug}-og.png`
  };
  writeFileSync(imageMapPath, JSON.stringify(imageMap, null, 2));

  // Add to articles array
  articles.push(article);
  writeFileSync(articlesPath, JSON.stringify(articles));

  console.log(`[generate] Article ${nextId} created: ${article.title} (${(article.body || '').split(/\s+/).length} words)`);

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
}

main().catch(err => {
  console.error('[generate] Fatal error:', err);
  process.exit(1);
});
