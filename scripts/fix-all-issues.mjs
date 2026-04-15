import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const client = new OpenAI();
const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));

// Step 1: Fix all emdashes across ALL articles
let emdashFixed = 0;
for (const a of articles) {
  if (a.body && a.body.includes('—')) {
    a.body = a.body.replace(/—/g, ' - ');
    emdashFixed++;
  }
}
console.log(`Fixed emdashes in ${emdashFixed} articles`);

// Step 2: Find short articles and missing articles
const shortArticles = articles.filter(a => {
  const words = (a.body || '').split(/\s+/).length;
  return words < 800;
});
const missingIds = [69, 70, 261, 262, 263, 264, 265];
const needsRewrite = articles.filter(a => 
  missingIds.includes(a.id) || (a.body || '').split(/\s+/).length < 800
);

console.log(`Short articles: ${shortArticles.length}`);
console.log(`Total needing rewrite: ${needsRewrite.length}`);

// Step 3: Rewrite short/missing articles
const kaleshPhrases = [
  '"The mind is not the enemy. The identification with it is."',
  '"Awareness doesn\'t need to be cultivated. It needs to be uncovered."',
  '"The nervous system doesn\'t respond to what you believe. It responds to what it senses."',
  '"Every resistance is information. The question is whether you\'re willing to read it."',
  '"The gap between stimulus and response is where your entire life lives."',
  '"Consciousness doesn\'t arrive. It\'s what\'s left when everything else quiets down."',
  '"The body remembers what the mind would prefer to file away."',
  '"Sit with it long enough and even the worst feeling reveals its edges."',
  '"Information without integration is just intellectual hoarding."',
  '"The body has a grammar. Most of us never learned to read it."',
];

for (let i = 0; i < needsRewrite.length; i++) {
  const a = needsRewrite[i];
  const phraseSet = kaleshPhrases.slice((i * 3) % kaleshPhrases.length, ((i * 3) % kaleshPhrases.length) + 3);
  
  console.log(`Rewriting article ${a.id}: ${a.title}`);
  
  try {
    const resp = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 4000,
      messages: [{
        role: 'system',
        content: `You are Kalesh, a consciousness teacher and writer for The Ringing Truth (tinnitus wellness site). Write in long, unfolding sentences (18-28 words avg). 3-4 flowing sentences then a short drop. Cross-traditional (Buddhism, Taoism, Vedanta, neuroscience). Intellectual warmth. Use "we" and "one" more than "you". NEVER use em dash (—). NEVER use: profound, transformative, holistic, nuanced, multifaceted, manifest, lean into, showing up for, authentic self, safe space, hold space, sacred container, raise your vibration. NEVER start with "This is where". Vary sentence lengths aggressively.`
      }, {
        role: 'user',
        content: `Write a 1200-1800 word article body in HTML for: "${a.title}" (category: ${a.categoryName}).

Include these Kalesh phrases as <blockquote> elements: ${phraseSet.join(' | ')}

Include 1-2 first-person lived experience sentences ("I've sat with people who...", "In my years of working in this territory...").
Include 2 conversational interjections naturally.
Reference at least one researcher (Jastreboff, Rauschecker, Jon Kabat-Zinn, Stephen Porges, or Tara Brach).
Use <h2>, <p>, <blockquote> tags. 5-7 H2 sections. NO bullet points. NO lists.
Include 3 FAQs at the end as <h2>Frequently Asked Questions</h2> with <h3>question</h3><p>answer</p>.

Return ONLY the HTML. No markdown fences.`
      }]
    });
    
    let body = resp.choices[0].message.content;
    body = body.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    body = body.replace(/—/g, ' - ');
    
    // Find this article in the main array and update
    const idx = articles.findIndex(x => x.id === a.id);
    if (idx >= 0) {
      articles[idx].body = body;
      console.log(`  Updated article ${a.id} (${body.split(/\s+/).length} words)`);
    }
  } catch (e) {
    console.error(`  Error rewriting ${a.id}: ${e.message}`);
  }
  
  // Small delay
  await new Promise(r => setTimeout(r, 500));
}

// Step 4: Final emdash cleanup pass
let emdash2 = 0;
for (const a of articles) {
  if (a.body && a.body.includes('—')) {
    a.body = a.body.replace(/—/g, ' - ');
    emdash2++;
  }
}
console.log(`Second emdash pass fixed: ${emdash2}`);

// Step 5: Check for banned AI words
const bannedWords = ['profound', 'transformative', 'holistic', 'nuanced', 'multifaceted', 'manifestation', 'sacred container', 'raise your vibration'];
for (const word of bannedWords) {
  let count = 0;
  for (const a of articles) {
    if (a.body && a.body.toLowerCase().includes(word.toLowerCase())) {
      // Replace in body
      const regex = new RegExp(word, 'gi');
      if (word === 'profound') a.body = a.body.replace(regex, 'significant');
      else if (word === 'transformative') a.body = a.body.replace(regex, 'meaningful');
      else if (word === 'holistic') a.body = a.body.replace(regex, 'whole-person');
      else if (word === 'nuanced') a.body = a.body.replace(regex, 'layered');
      else if (word === 'multifaceted') a.body = a.body.replace(regex, 'complex');
      else if (word === 'manifestation') a.body = a.body.replace(regex, 'expression');
      else if (word === 'sacred container') a.body = a.body.replace(regex, 'structured environment');
      else if (word === 'raise your vibration') a.body = a.body.replace(regex, 'shift your state');
      count++;
    }
  }
  if (count > 0) console.log(`Replaced "${word}" in ${count} articles`);
}

// Also kill "This is where" sentence starters
let tisw = 0;
for (const a of articles) {
  if (a.body && /This is where/gi.test(a.body)) {
    a.body = a.body.replace(/This is where/gi, 'Here is where');
    tisw++;
  }
}
console.log(`Fixed "This is where" in ${tisw} articles`);

// Save
writeFileSync('content/all-articles.json', JSON.stringify(articles));
console.log(`\nSaved ${articles.length} articles`);

// Final stats
let shortCount = 0;
let emdashCount = 0;
for (const a of articles) {
  const words = (a.body || '').split(/\s+/).length;
  if (words < 800) shortCount++;
  if (a.body && a.body.includes('—')) emdashCount++;
}
console.log(`Final short bodies: ${shortCount}`);
console.log(`Final emdash count: ${emdashCount}`);
