// ─── REGENERATE QUEUED ARTICLES UNDER 1800 WORDS ───
// Uses DeepSeek V4-Pro. Enforces 1800+ word quality gate. Strips banned words. Injects Amazon links.
// One-time run from this session only. Not scheduled.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-pro';
const AMAZON_TAG = 'spankyspinola-20';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const START_FROM = parseInt(process.env.START_FROM || '0', 10);

if (!API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const BANNED_WORDS = ['delve', 'tapestry', 'paradigm', 'synergy', 'leverage', 'unlock', 'empower', 'utilize', 'pivotal', 'embark', 'underscore', 'paramount', 'seamlessly', 'robust', 'beacon', 'foster', 'elevate', 'curate', 'curated', 'bespoke', 'resonate', 'harness', 'intricate', 'plethora', 'myriad', 'comprehensive', 'transformative', 'groundbreaking', 'innovative', 'cutting-edge', 'revolutionary', 'state-of-the-art', 'ever-evolving', 'profound', 'holistic', 'nuanced', 'multifaceted', 'stakeholders', 'ecosystem', 'furthermore', 'moreover', 'additionally', 'consequently', 'subsequently', 'thereby', 'streamline', 'optimize', 'facilitate', 'amplify', 'catalyze', 'landscape', 'framework'];

const WORD_REPLACEMENTS = {
  'delve': 'explore', 'tapestry': 'pattern', 'paradigm': 'model', 'synergy': 'connection',
  'leverage': 'use', 'unlock': 'open', 'empower': 'support', 'utilize': 'use',
  'pivotal': 'key', 'embark': 'begin', 'underscore': 'highlight', 'paramount': 'essential',
  'seamlessly': 'smoothly', 'robust': 'strong', 'beacon': 'guide', 'foster': 'encourage',
  'elevate': 'raise', 'curate': 'select', 'curated': 'selected', 'bespoke': 'custom',
  'resonate': 'connect', 'harness': 'use', 'intricate': 'complex', 'plethora': 'many',
  'myriad': 'many', 'comprehensive': 'thorough', 'transformative': 'powerful',
  'groundbreaking': 'new', 'innovative': 'creative', 'cutting-edge': 'modern',
  'revolutionary': 'new', 'state-of-the-art': 'modern', 'ever-evolving': 'changing',
  'profound': 'deep', 'holistic': 'whole-body', 'nuanced': 'subtle',
  'multifaceted': 'complex', 'stakeholders': 'people involved', 'ecosystem': 'system',
  'furthermore': 'also', 'moreover': 'also', 'additionally': 'also',
  'consequently': 'so', 'subsequently': 'then', 'thereby': 'so',
  'streamline': 'simplify', 'optimize': 'improve', 'facilitate': 'help',
  'amplify': 'increase', 'catalyze': 'trigger', 'landscape': 'field', 'framework': 'structure'
};

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
];

const INTERJECTIONS = [
  'Stay with me here.', 'I know, I know.', 'Wild, right?',
  'Think about that for a second.', 'Here is what gets interesting.',
  'And this is the part nobody talks about.', 'Bear with me on this one.',
  'Sounds strange, I realize.', 'Stick with this for a moment.',
  'Now here is the thing.', 'Let that land for a second.',
  'I get it. Really, I do.', 'Hang on, because this matters.',
  'This part surprised me too.', 'Worth sitting with, that one.',
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

function stripBannedWords(body) {
  let result = body;
  for (const [banned, replacement] of Object.entries(WORD_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${banned}\\b`, 'gi');
    result = result.replace(regex, replacement);
  }
  // Strip emdashes
  result = result.replace(/\u2014/g, ', ');
  result = result.replace(/\u2013/g, ', ');
  result = result.replace(/&mdash;/g, ', ');
  result = result.replace(/&ndash;/g, ', ');
  return result;
}

function countWords(body) {
  return (body || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(w => w.length > 0).length;
}

async function generateArticle(article, products) {
  const selectedPhrases = shuffle(KALESH_PHRASES).slice(0, 4);
  const selectedInterjections = shuffle(INTERJECTIONS).slice(0, 2);
  const nicheRef = shuffle(NICHE_RESEARCHERS).slice(0, 2);
  const spiritRef = shuffle(SPIRITUAL_RESEARCHERS).slice(0, 1);
  const selectedProducts = shuffle(products).slice(0, 6);
  const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

  const prompt = `You are Kalesh, a consciousness teacher and writer for The Ringing Truth (tinnitus wellness site at ringingtruth.com).

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
- 7-9 H2 sections, each 3-5 paragraphs of 3-5 sentences each
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists, no <ul>, no <ol>, no <li>
- Include a "Your Healing Journey: Tools Worth Exploring" section near the end with 2-3 Amazon product links
- Include 2-3 FAQs at the end as H2 "Frequently Asked Questions" with <p> answers

MANDATORY AMAZON PRODUCT LINKS (MINIMUM 4 in body text + Healing Journey section):
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

RULES FOR AMAZON LINKS:
1. You MUST include AT LEAST 4 Amazon product links woven naturally into the article body paragraphs
2. Each inline link should recommend a product that genuinely relates to the paragraph topic
3. Use natural phrasing like "Many people find the [Product Link] (paid link) helpful for this"
4. THEN also include a "Your Healing Journey: Tools Worth Exploring" section near the end with 2-3 more product links
5. Total Amazon links in the article should be 5-7
6. Every single link MUST include ?tag=${AMAZON_TAG} and the text "(paid link)" after it

HARD RULES:
- MINIMUM 1,800 words. TARGET 2,000-2,200 words. This is NON-NEGOTIABLE.
- Write LONG. Write MORE. Each H2 section should be 250-350 words minimum.
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze, landscape, framework.
- Never use these phrases: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long ones that stretch across a full breath. Some just three words.
- Include at least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting," "Think about it," "That said."
- Concrete specifics over abstractions. A name. A number. A moment.
- No em-dashes. No em-dashes. No em-dashes.

Return ONLY the HTML body. No JSON wrapper. No markdown code fences. Just raw HTML starting with <h2> and ending with </p>.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout for v4-pro reasoning
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      temperature: 0.85,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Rewrite and expand this article to 2000+ words: "${article.title}" (category: ${article.categoryName || 'The Mind'}). The article is about tinnitus and consciousness. Return ONLY HTML body, no code fences.` }
      ]
    })
  });

  clearTimeout(timeout);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  let body = data.choices[0].message.content;
  
  // Strip code fences if present
  body = body.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
  
  // Strip banned words
  body = stripBannedWords(body);
  
  return body;
}

function injectAmazonLinks(body, products) {
  const amazonCount = (body.match(/amazon\.com\/dp\//g) || []).length;
  if (amazonCount >= 3) return body;
  
  const needed = 3 - amazonCount;
  const extra = shuffle(products).slice(0, needed);
  
  for (let pi = 0; pi < extra.length; pi++) {
    const ep = extra[pi];
    const allP = [...body.matchAll(/<\/p>/g)];
    const insertIdx = Math.floor(allP.length * (0.2 + pi * 0.25));
    if (allP[insertIdx]) {
      const pos = allP[insertIdx].index + 4;
      const link = `<a href="https://www.amazon.com/dp/${ep.asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${ep.name}</a> (paid link)`;
      body = body.slice(0, pos) + `\n<p>Many readers have found the ${link} genuinely useful for this.</p>` + body.slice(pos);
    }
  }
  
  return body;
}

async function main() {
  console.log(`[regen] Starting regeneration with model: ${MODEL}`);
  console.log(`[regen] Batch size: ${BATCH_SIZE}, starting from index: ${START_FROM}`);
  
  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const products = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];
  
  // Find all queued articles under 1800 words
  const needsRegen = articles.filter(a => {
    if (a.status !== 'queued') return false;
    const words = countWords(a.body);
    return words < 1800;
  });
  
  console.log(`[regen] Total needing regeneration: ${needsRegen.length}`);
  
  const batch = needsRegen.slice(START_FROM, START_FROM + BATCH_SIZE);
  console.log(`[regen] Processing batch: ${batch.length} articles (index ${START_FROM} to ${START_FROM + batch.length - 1})`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < batch.length; i++) {
    const article = batch[i];
    const globalIdx = START_FROM + i;
    console.log(`[regen] ${globalIdx + 1}/${needsRegen.length} — ID ${article.id}: "${article.title?.slice(0, 50)}..."`);
    
    let passed = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let body = await generateArticle(article, products);
        body = injectAmazonLinks(body, products);
        
        const words = countWords(body);
        const amazonLinks = (body.match(/amazon\.com\/dp\//g) || []).length;
        const hasBanned = BANNED_WORDS.some(w => body.toLowerCase().includes(w.toLowerCase()));
        
        if (words >= 1800 && amazonLinks >= 3) {
          // Update the article in the main array
          const idx = articles.findIndex(a => a.id === article.id);
          if (idx >= 0) {
            articles[idx].body = body;
            articles[idx].wordCount = words;
            articles[idx].regenerated = true;
            articles[idx].regenDate = new Date().toISOString().split('T')[0];
          }
          console.log(`  ✓ PASSED: ${words} words, ${amazonLinks} Amazon links${hasBanned ? ' (banned words stripped)' : ''}`);
          success++;
          passed = true;
          break;
        } else {
          console.log(`  ✗ Attempt ${attempt}: ${words} words, ${amazonLinks} links — ${words < 1800 ? 'TOO SHORT' : 'NOT ENOUGH LINKS'}`);
        }
      } catch (e) {
        console.error(`  ✗ Attempt ${attempt} error: ${e.message}`);
      }
      
      // Wait between retries with exponential backoff
      const backoff = attempt * 15000; // 15s, 30s, 45s
      console.log(`  [wait] Backing off ${backoff/1000}s before retry...`);
      await new Promise(r => setTimeout(r, backoff));
    }
    
    if (!passed) {
      failed++;
      console.log(`  ✗ FAILED after 3 attempts — keeping original`);
    }
    
    // Save every 5 articles to avoid data loss
    if ((i + 1) % 5 === 0 || i === batch.length - 1) {
      writeFileSync(articlesPath, JSON.stringify(articles));
      console.log(`  [saved] Progress saved (${success} success, ${failed} failed)`);
    }
    
    // Rate limit: wait 60s between articles to avoid 429 on v4-pro
    if (i < batch.length - 1) {
      console.log(`  [wait] Pacing: 60s before next article...`);
      await new Promise(r => setTimeout(r, 60000));
    }
  }
  
  console.log(`\n[regen] Batch complete: ${success} regenerated, ${failed} failed`);
  console.log(`[regen] Remaining: ${needsRegen.length - START_FROM - batch.length} articles still need regeneration`);
  
  // Final save
  writeFileSync(articlesPath, JSON.stringify(articles));
}

main().catch(err => {
  console.error('[regen] Fatal:', err);
  process.exit(1);
});
