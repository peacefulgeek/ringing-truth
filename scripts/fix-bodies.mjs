import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const client = new OpenAI();
const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));

const toFix = articles.filter(a => {
  if (!a.body) return true;
  if (a.body.includes('placeholder heading')) return true;
  if (a.body.includes('placeholder')) return true;
  if (a.body.length < 2000) return true;
  return false;
});

console.log(`Fixing ${toFix.length} articles with placeholder/short bodies...`);

const VOICE_PROMPT = `You are Kalesh, a consciousness teacher and writer. Write in long, unfolding sentences with intellectual warmth. Cross-traditional references (Buddhism, Vedanta, neuroscience, contemplative psychology). Use phrases like "what I find remarkable", "the research suggests something deeper", "there's a quiet revolution happening". Reference researchers: Jiddu Krishnamurti, Alan Watts, Sam Harris, Sadhguru, Tara Brach. NO bullet points. NO listicles. Write flowing paragraphs.`;

async function fixArticle(article) {
  const faqCount = article.faqCount || (article.faqs ? article.faqs.length : 0);
  
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: VOICE_PROMPT },
      { role: 'user', content: `Write a 2500-2800 word article in HTML format about "${article.title}" for a tinnitus wellness website in the category "${article.categoryName}".

Requirements:
- 5-7 H2 sections with descriptive headings
- Each section 3-5 paragraphs
- Include 1-2 blockquotes with contemplative insights
- Use <p>, <h2>, <blockquote> tags only (no <h1>)
- Weave together neuroscience, clinical research, and contemplative wisdom
- Write with warmth, depth, and intellectual honesty
- NO bullet points, NO lists, NO placeholder text
- Return ONLY the HTML body content, no wrapper tags` }
    ],
    max_tokens: 4000,
    temperature: 0.75,
  });
  
  let body = response.choices[0].message.content;
  // Strip markdown code fences if present
  body = body.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
  return body;
}

let fixed = 0;
for (const article of toFix) {
  try {
    console.log(`  Fixing [${article.id}]: ${article.title} (${article.body ? article.body.length : 0} chars)...`);
    const newBody = await fixArticle(article);
    const idx = articles.findIndex(a => a.id === article.id);
    if (newBody.length > 2000) {
      articles[idx].body = newBody;
      fixed++;
      console.log(`  Done: ${newBody.length} chars`);
    } else {
      console.log(`  Skipped: generated body too short (${newBody.length} chars)`);
    }
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
  }
}

writeFileSync('content/all-articles.json', JSON.stringify(articles, null, 2));
console.log(`Fixed ${fixed}/${toFix.length} articles.`);
