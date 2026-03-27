// ─── FEATURE FLAG (stays in code — not a secret) ───
const AUTO_GEN_ENABLED = false; // Wildman flips to true on GitHub when ready

// ─── FROM RENDER ENV VARS (auto-revoked if found in code) ───
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FAL_KEY = process.env.FAL_API_KEY;
const GH_PAT = process.env.GH_PAT;

// ─── HARDCODED (Bunny is safe in code) ───
const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';
const GITHUB_REPO = 'peacefulgeek/ringing-truth';

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
  'https://www.ata.org',
  'https://www.ncbi.nlm.nih.gov',
  'https://www.mayoclinic.org',
  'https://www.nidcd.nih.gov',
  'https://www.asha.org',
  'https://www.health.harvard.edu',
  'https://pubmed.ncbi.nlm.nih.gov',
  'https://www.bta.org.uk',
];

const NICHE_RESEARCHERS = [
  'Pawel Jastreboff', 'David Baguley', 'Richard Hallam',
  'Laurence McKenna', 'Josef Rauschecker', 'Susan Shore', 'Hubert Lim'
];

const SPIRITUAL_RESEARCHERS = [
  'Jiddu Krishnamurti', 'Alan Watts', 'Sam Harris', 'Sadhguru', 'Tara Brach'
];

const KALESH_PHRASES = [
  'what wants to be felt', 'the body keeps the score before the mind reads it',
  'awareness is not the absence of noise — it is the space that holds it',
  'you are not broken — you are listening', 'the ringing is not the enemy',
  'peace does not require silence', 'what you resist, persists — and amplifies',
  'the nervous system remembers what the mind forgets',
  'healing is not linear — and it was never supposed to be',
  'there is a difference between hearing and listening',
  'the sound is not the suffering — the resistance is',
  'your body is not a problem to be solved',
  'stillness is not the absence of sound — it is the presence of attention',
  'the ear hears — but the brain decides what matters',
  'you have survived every difficult moment so far',
  'the invitation is not to fix — but to feel',
  'what if the ringing is not a malfunction but a message',
  'the nervous system does not lie',
  'presence is the most radical act of healing',
  'you are not your diagnosis',
];

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

  console.log('[generate] Starting article generation...');

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

  // Find next article ID
  const maxId = articles.reduce((max, a) => Math.max(max, a.id || 0), 0);
  const nextId = maxId + 1;

  // Pick a random category
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  // Generate article via Anthropic
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
      system: `You are writing for ${SITE_NAME}, a tinnitus resource site. Author voice: ${AUTHOR_NAME}, ${AUTHOR_TITLE}. Write in long, unfolding sentences with intellectual warmth. Cross-traditional references. Use 3-5 of these phrases naturally: ${KALESH_PHRASES.slice(0, 10).join(', ')}. Include named references from: ${NICHE_RESEARCHERS.join(', ')} (70%) and ${SPIRITUAL_RESEARCHERS.join(', ')} (30%). Include lived experience markers. Use HTML <a href> links only. External links get rel="nofollow". Links to ${AUTHOR_LINK} have no rel attribute. 2500-2800 words. Varied openers (not starting with "You"). Include 3-5 internal links to /articles/[slug]. Output JSON with: title, slug, body (HTML), metaDescription, heroImagePrompt (2-3 sentence scene), faqCount (0-5), faqs (array of {question, answer}).`,
      messages: [{
        role: 'user',
        content: `Write a new article for the "${category.name}" category about tinnitus. Pick an original topic not covered before. Return valid JSON only.`
      }]
    })
  });

  if (!response.ok) {
    console.error('[generate] Anthropic API error:', response.status);
    process.exit(1);
  }

  const data = await response.json();
  const text = data.content[0].text;
  
  // Parse JSON from response
  let article;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    article = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[generate] Failed to parse article JSON');
    process.exit(1);
  }

  // Set metadata
  article.id = nextId;
  article.category = category.slug;
  article.categoryName = category.name;
  article.dateISO = new Date().toISOString().split('T')[0];
  article.readingTime = Math.ceil((article.body || '').split(/\s+/).length / 250);

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
          // Download and upload to Bunny
          const imgBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
          
          // Upload hero
          await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/images/${article.slug}-hero.webp`, {
            method: 'PUT',
            headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
            body: Buffer.from(imgBuffer)
          });

          // Upload OG
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
  writeFileSync(articlesPath, JSON.stringify(articles, null, 2));

  console.log(`[generate] Article ${nextId} created: ${article.title}`);

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
