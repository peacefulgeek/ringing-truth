// Regenerate 4 articles with low sentence variance
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

  const targetIds = [106, 107, 108, 110];
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  for (const id of targetIds) {
    const idx = articles.findIndex(a => a.id === id);
    if (idx < 0) continue;
    const article = articles[idx];
    console.log(`Rewriting #${id} "${article.title}"...`);

    const selectedProducts = shuffle(catalog).slice(0, 6);
    const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

    try {
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
              content: `You are Kalesh, a consciousness teacher and writer for The Ringing Truth (tinnitus wellness site).

CRITICAL: Your sentence lengths MUST vary dramatically. Follow this pattern:
- Write 2-3 sentences of 20-30 words each
- Then drop ONE sentence of 2-5 words. Like this. Or this one.
- Then write 1 sentence of 15-25 words
- Then another short one. Just like that.
- Then a longer flowing sentence that builds and turns and carries the reader forward through the idea

HARD RULES:
- 1,400 to 1,700 words
- Zero em-dashes. Use commas, periods, colons, or parentheses.
- Never use: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze.
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- At least 8 sentences of 6 words or fewer scattered throughout.
- At least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is."
- Include 2 conversational interjections and 1-2 first-person lived experience sentences.
- HTML only: <h2>, <p>, <blockquote>. No bullet points, no lists.
- Include at least 3 Amazon product links in body + 2-3 in a "Your Healing Journey" section.

VERIFIED PRODUCTS:
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

Return ONLY HTML body. No code fences.`
            },
            {
              role: 'user',
              content: `Completely rewrite this article with WILDLY varied sentence lengths:\n\nTitle: "${article.title}"\nCategory: ${article.categoryName}\nTopic: ${article.title}\n\nReturn ONLY the HTML body.`
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
      
      // Check sentence variance
      const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const lengths = sentences.map(s => s.trim().split(/\s+/).length);
      const mean = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
      const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lengths.length || 1);
      const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
      const shortCount = lengths.filter(l => l <= 6).length;

      console.log(`  ${newWc} words, stdDev=${stdDev}, short=${shortCount}`);

      if (newWc >= 1200) {
        articles[idx].body = body;
        console.log(`  Updated.`);
      } else {
        console.log(`  Too short (${newWc}), keeping original`);
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
