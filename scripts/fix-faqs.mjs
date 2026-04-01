import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const client = new OpenAI();
const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));

const toFix = articles.filter(a => {
  if (!a.faqs || a.faqs.length === 0) return false;
  return a.faqs[0] && a.faqs[0].question && a.faqs[0].question.includes('Generated FAQ');
});

console.log(`Fixing ${toFix.length} articles with placeholder FAQs...`);

async function fixArticle(article) {
  const faqCount = article.faqs.length;
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [{
      role: 'user',
      content: `Generate ${faqCount} FAQ questions and answers about the topic "${article.title}" for a tinnitus wellness website. Return ONLY a JSON array like: [{"question":"...","answer":"..."}]`
    }],
    max_tokens: 1500,
    temperature: 0.7,
  });
  
  const text = response.choices[0].message.content;
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found');
  return JSON.parse(match[0]);
}

for (const article of toFix) {
  try {
    console.log(`  Fixing: ${article.title} (${article.faqs.length} FAQs)...`);
    const newFaqs = await fixArticle(article);
    const idx = articles.findIndex(a => a.id === article.id);
    articles[idx].faqs = newFaqs;
    console.log(`  Done: ${newFaqs.length} FAQs generated`);
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
  }
}

writeFileSync('content/all-articles.json', JSON.stringify(articles, null, 2));
console.log('All FAQs fixed and saved.');
