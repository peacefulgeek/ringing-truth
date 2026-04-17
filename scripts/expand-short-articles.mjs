// Expand articles under 1200 words using OpenAI API
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AMAZON_TAG = 'spankyspinola-20';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
}

async function main() {
  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];

  // Find articles under 1200 words
  const shortArticles = articles.filter(a => a.body && wordCount(a.body) < 1200);
  console.log(`Found ${shortArticles.length} articles under 1200 words\n`);

  for (const article of shortArticles) {
    const wc = wordCount(article.body);
    console.log(`Expanding #${article.id} "${article.title}" (${wc} words)...`);

    const selectedProducts = shuffle(catalog).slice(0, 6);
    const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          max_tokens: 8000,
          messages: [
            {
              role: 'system',
              content: `You are Kalesh, a consciousness teacher and writer for The Ringing Truth (tinnitus wellness site). You write with intellectual warmth, cross-traditional references (Buddhism, Taoism, Vedanta, neuroscience), and observer-humor.

Your task: REWRITE and EXPAND this article to exactly 1600-1800 words. Keep the same title and topic but write entirely fresh, richer content with more depth, examples, and research references.

HARD RULES:
- 1,600 to 1,800 words (STRICT - count carefully)
- Zero em-dashes. Use commas, periods, colons, or parentheses instead.
- Never use: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze.
- Never use: "it's important to note," "in conclusion," "in summary," "in the realm of," "dive deep into," "at the end of the day," "in today's fast-paced world," "plays a crucial role," "a testament to," "when it comes to," "cannot be overstated."
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Include at least 4 short sentences (3-6 words). Mix with long flowing ones.
- Include at least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is," "But here's what's interesting."
- Include 2 conversational interjections and 1-2 first-person lived experience sentences.
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists, no markdown.
- 5-7 H2 sections, each 2-4 paragraphs.
- Include at least 3 Amazon product links naturally in body text + 2-3 in a "Your Healing Journey" section.

VERIFIED PRODUCTS TO USE:
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

Return ONLY the HTML body. No code fences. No explanation.`
            },
            {
              role: 'user',
              content: `Rewrite and expand this article to 1600-1800 words:\n\nTitle: "${article.title}"\nCategory: ${article.categoryName}\n\nCurrent body (${wc} words):\n${article.body}\n\nReturn ONLY the expanded HTML body.`
            }
          ]
        })
      });

      if (!response.ok) {
        console.error(`  API error ${response.status}`);
        continue;
      }

      const data = await response.json();
      let body = data.choices[0].message.content;
      body = body.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      body = body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
      body = body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');

      const newWc = wordCount(body);
      if (newWc >= 1200) {
        const idx = articles.findIndex(a => a.id === article.id);
        if (idx >= 0) {
          articles[idx].body = body;
          console.log(`  Expanded to ${newWc} words`);
        }
      } else {
        console.log(`  Still too short (${newWc}), keeping original`);
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log('\nDone. Saved updated articles.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
