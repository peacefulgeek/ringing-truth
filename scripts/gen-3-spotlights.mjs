import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const client = new OpenAI();

const SPOTLIGHTS = [
  {
    topic: 'The Best White Noise Machines for Tinnitus Relief in 2026',
    slug: 'best-white-noise-machines-tinnitus-2026',
    category: 'the-management',
    categoryName: 'The Management',
    products: [
      { name: 'LectroFan EVO', asin: 'B07RWLJ5DB', desc: '22 unique non-looping sounds' },
      { name: 'Marpac Dohm Classic', asin: 'B00MY0YB5E', desc: 'mechanical fan-based white noise' },
      { name: 'Hatch Restore 2', asin: 'B0C5KG6CFH', desc: 'smart sleep sound machine' },
      { name: 'Yogasleep Rohm', asin: 'B07L6MHFQ3', desc: 'portable travel sound machine' },
    ]
  },
  {
    topic: 'Noise-Cancelling Headphones for Tinnitus: A Comprehensive Guide',
    slug: 'noise-cancelling-headphones-tinnitus-guide',
    category: 'the-management',
    categoryName: 'The Management',
    products: [
      { name: 'Sony WH-1000XM5', asin: 'B0CX23V2ZK', desc: 'industry-leading ANC' },
      { name: 'Apple AirPods Pro', asin: 'B09XS7JWHH', desc: 'adaptive transparency mode' },
      { name: 'Bose QuietComfort Ultra', asin: 'B0D1XD1ZV3', desc: 'CustomTune technology' },
      { name: 'Loop Quiet Ear Plugs', asin: 'B07N1XJ1C2', desc: 'stylish noise reduction' },
    ]
  },
  {
    topic: 'Essential Books for Understanding and Living with Tinnitus',
    slug: 'essential-books-tinnitus-consciousness',
    category: 'the-deeper-listening',
    categoryName: 'The Deeper Listening',
    products: [
      { name: 'Wherever You Go, There You Are', asin: 'B07D23CFGR', desc: 'Jon Kabat-Zinn mindfulness classic' },
      { name: 'Waking Up', asin: 'B00HE67WQQ', desc: 'Sam Harris on consciousness' },
      { name: 'The Power of Now', asin: 'B005LFYGJQ', desc: 'Eckhart Tolle on presence' },
      { name: 'The Body Keeps the Score', asin: 'B074BDJFHX', desc: 'Bessel van der Kolk on trauma' },
      { name: 'Full Catastrophe Living', asin: 'B0752FL328', desc: 'Kabat-Zinn MBSR program' },
    ]
  }
];

async function generateSpotlight(spotlight, id) {
  const productList = spotlight.products.map(p =>
    `- ${p.name} (ASIN: ${p.asin}): ${p.desc}`
  ).join('\n');

  const prompt = `Write a product spotlight article for a tinnitus wellness site called "The Ringing Truth". The author is Kalesh, a Consciousness Teacher & Writer.

Topic: ${spotlight.topic}

Products to review (use Amazon affiliate links with tag=spankyspinola-20):
${productList}

Requirements:
- 2000-2500 words of HTML body content
- Use <h2> sections for each product and for intro/conclusion
- Each Amazon link must include "(paid link)" label immediately after
- Include a warm, evidence-informed voice
- Include practical advice on how each product helps with tinnitus
- Include an affiliate disclosure paragraph at the top
- Include 2-3 FAQs
- Write a compelling meta description (max 155 chars)
- Write a hero image prompt (describe a scene related to the topic)

Return ONLY valid JSON:
{
  "title": "${spotlight.topic}",
  "metaDescription": "...",
  "body": "<h2>...</h2><p>...</p>...",
  "faqs": [{"question":"...","answer":"..."}],
  "heroImagePrompt": "..."
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON for ${spotlight.slug}`);

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    id,
    title: parsed.title || spotlight.topic,
    slug: spotlight.slug,
    metaDescription: parsed.metaDescription || '',
    category: spotlight.category,
    categoryName: spotlight.categoryName,
    body: parsed.body || '',
    faqs: parsed.faqs || [],
    heroImagePrompt: parsed.heroImagePrompt || '',
    dateISO: '2026-01-15',
    readingTime: Math.ceil((parsed.body || '').replace(/<[^>]+>/g, '').split(/\s+/).length / 250),
    hasAffiliateLink: true,
    linkType: 'product',
    isProductSpotlight: true,
  };
}

async function main() {
  const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
  let nextId = articles.length + 1;

  for (const spotlight of SPOTLIGHTS) {
    console.log(`Generating: ${spotlight.topic}...`);
    try {
      const article = await generateSpotlight(spotlight, nextId);
      articles.push(article);
      console.log(`  Done: ${article.title} (${article.body.length} chars)`);
      nextId++;
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }

  writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles, null, 2));
  console.log(`Total articles: ${articles.length}`);
}

main();
