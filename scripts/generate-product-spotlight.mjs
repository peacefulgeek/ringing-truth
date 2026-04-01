// ─── PRODUCT SPOTLIGHT ARTICLE GENERATOR ───
// Runs every Saturday via cron to generate a product-focused article
// Uses the same pipeline as generate-articles.mjs but with product focus

const AUTO_GEN_ENABLED = true;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FAL_KEY = process.env.FAL_API_KEY;
const GH_PAT = process.env.GH_PAT;

const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';
const GITHUB_REPO = 'peacefulgeek/ringing-truth';

const SITE_NAME = 'The Ringing Truth';
const AUTHOR_NAME = 'Kalesh';
const AUTHOR_LINK = 'https://kalesh.love';

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

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

if (!AUTO_GEN_ENABLED) {
  console.log('[product-spotlight] AUTO_GEN_ENABLED is false. Exiting.');
  process.exit(0);
}

if (!ANTHROPIC_API_KEY) {
  console.log('[product-spotlight] No ANTHROPIC_API_KEY set. Exiting.');
  process.exit(0);
}

async function main() {
  console.log('[product-spotlight] Starting product spotlight generation...');
  
  const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
  const nextId = articles.length + 1;
  const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
  
  const today = new Date();
  const dateISO = today.toISOString().split('T')[0];
  
  console.log(`[product-spotlight] Generating article #${nextId} for category: ${category}`);
  
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
        system: `You are a product review writer for ${SITE_NAME}, a tinnitus wellness site. Write in a warm, evidence-informed voice. Author is ${AUTHOR_NAME}. Include Amazon affiliate links with tag=spankyspinola-20. Include "(paid link)" after each affiliate link. Include a health disclaimer. Return valid JSON only.`,
        messages: [{
          role: 'user',
          content: `Write a product spotlight article about ${category.replace(/-/g, ' ')} for tinnitus management. Return JSON with these fields:
{
  "title": "compelling product review title",
  "slug": "url-friendly-slug",
  "metaDescription": "155 char max SEO description",
  "category": "the-management",
  "categoryName": "The Management",
  "body": "2000-2500 word HTML article with h2 sections, product recommendations with Amazon links (tag=spankyspinola-20), (paid link) labels, and health disclaimer",
  "faqs": [{"question": "...", "answer": "..."}],
  "heroImagePrompt": "descriptive prompt for hero image"
}`
        }]
      })
    });
    
    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    const article = JSON.parse(jsonMatch[0]);
    article.id = nextId;
    article.dateISO = dateISO;
    article.readingTime = Math.ceil(article.body.replace(/<[^>]+>/g, '').split(/\s+/).length / 250);
    article.hasAffiliateLink = true;
    article.linkType = 'product';
    article.isProductSpotlight = true;
    
    articles.push(article);
    writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles, null, 2));
    
    console.log(`[product-spotlight] Article "${article.title}" generated and saved.`);
    
    // Git commit and push if GH_PAT available
    if (GH_PAT) {
      const { execSync } = await import('child_process');
      try {
        execSync(`cd ${ROOT} && git add content/all-articles.json && git commit -m "Add product spotlight: ${article.title}" && git push`, {
          env: { ...process.env, GIT_ASKPASS: 'echo', GIT_USERNAME: 'x-access-token', GIT_PASSWORD: GH_PAT },
          stdio: 'inherit'
        });
        console.log('[product-spotlight] Pushed to GitHub.');
      } catch (e) {
        console.error('[product-spotlight] Git push failed:', e.message);
      }
    }
    
  } catch (err) {
    console.error('[product-spotlight] Generation failed:', err.message);
    process.exit(1);
  }
}

main();
