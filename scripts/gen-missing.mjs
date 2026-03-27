import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const client = new OpenAI();
const batch = JSON.parse(readFileSync('content/batch-500.json', 'utf8'));

const prompt = `Generate 10 articles for "The Ringing Truth" tinnitus website. Here is the metadata for each article:

${JSON.stringify(batch, null, 2)}

For EACH article, write 2,500-2,800 words.

VOICE — KALESH: Long sentences (18-28 words), em-dashes, triads, intellectual warmth, cross-traditional (Buddhism/Taoism/Vedanta/neuroscience), "awareness"/"consciousness" not "divine"/"God".

RULES:
1. Use openerType for opening style
2. 1-2 first-person lived experience sentences in body
3. Weave researcher naturally into text
4. Scatter ALL phrases from metadata throughout article
5. FAQ: use faqCount (0 = no FAQ section)
6. conclusionType: challenge=provocation, tender=earned tenderness. NO generic comfort.
7. backlinkType: kalesh=link to https://kalesh.love with anchor, external=link with rel="nofollow", internal=no outbound
8. 3-5 internal links using href="/articles/SLUG"
9. HTML links only. 4-6 unique H2s.
10. NEVER use: "manifest", "lean into", "showing up for", "authentic self", "safe space", "hold space", "sacred container", "raise your vibration", "This is where"

OUTPUT: Return ONLY a JSON array. Each object: id, slug, title, category, categoryName, dateISO, metaDescription (<160 chars), heroImagePrompt (luminous warm article-specific scene), readingTime, body (full HTML no h1), faqCount, faqs [{question,answer}].`;

async function main() {
  console.log('Generating 10 articles...');
  
  // Generate in 2 batches of 5 to stay within token limits
  const results = [];
  
  for (let i = 0; i < 2; i++) {
    const subBatch = batch.slice(i * 5, (i + 1) * 5);
    const subPrompt = `Generate 5 articles for "The Ringing Truth" tinnitus website. Metadata:

${JSON.stringify(subBatch, null, 2)}

For EACH article, write 2,500-2,800 words in Kalesh's voice (long sentences 18-28 words, em-dashes, triads, intellectual warmth, cross-traditional Buddhism/Taoism/Vedanta/neuroscience, "awareness"/"consciousness" not "divine"/"God").

RULES: Use openerType for opening. 1-2 first-person sentences. Weave researcher naturally. Scatter ALL phrases. FAQ per faqCount (0=none). conclusionType: challenge=provocation, tender=earned tenderness. backlinkType: kalesh=link to https://kalesh.love, external=link with rel="nofollow", internal=no outbound. 3-5 internal links href="/articles/SLUG". HTML links only. 4-6 unique H2s. NEVER use banned phrases.

Return ONLY a JSON array. Each object: id, slug, title, category, categoryName, dateISO, metaDescription (<160 chars), heroImagePrompt (luminous warm article-specific), readingTime, body (full HTML no h1), faqCount, faqs [{question,answer}].`;

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: subPrompt }],
      max_tokens: 30000,
      temperature: 0.8,
    });
    
    let text = response.choices[0].message.content;
    // Strip markdown fences if present
    text = text.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    
    try {
      const articles = JSON.parse(text);
      results.push(...articles);
      console.log(`Batch ${i+1}: ${articles.length} articles generated`);
    } catch (e) {
      console.error(`Batch ${i+1} parse error:`, e.message);
      // Try to extract JSON
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const articles = JSON.parse(match[0]);
        results.push(...articles);
        console.log(`Batch ${i+1}: ${articles.length} articles extracted`);
      }
    }
  }
  
  writeFileSync('content/articles-last-batch.json', JSON.stringify(results, null, 2));
  console.log(`Total: ${results.length} articles written to content/articles-last-batch.json`);
}

main().catch(console.error);
