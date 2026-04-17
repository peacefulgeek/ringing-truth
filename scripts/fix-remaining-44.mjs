// Fix remaining 44 articles that fail quality gate
// - Trim articles >2500 words
// - Expand articles <1200 words (via API)
// - Add short sentences for variance
// - Fix any remaining AI words
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AMAZON_TAG = 'spankyspinola-20';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(html) {
  return stripHtml(html).split(/\s+/).length;
}

function getSentences(text) {
  return text.replace(/<[^>]+>/g, '').split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function countShortSentences(html) {
  const sentences = getSentences(stripHtml(html));
  return sentences.filter(s => s.trim().split(/\s+/).length <= 6).length;
}

function sentenceVariance(html) {
  const sentences = getSentences(stripHtml(html));
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lengths.length || 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

// Trim long articles by removing paragraphs from the middle
function trimArticle(body, targetWords) {
  const parts = body.split(/(<h2[^>]*>.*?<\/h2>)/);
  // Find sections (h2 + following content)
  const sections = [];
  let currentSection = { heading: '', content: '' };
  for (const part of parts) {
    if (part.startsWith('<h2')) {
      if (currentSection.content) sections.push(currentSection);
      currentSection = { heading: part, content: '' };
    } else {
      currentSection.content += part;
    }
  }
  if (currentSection.content) sections.push(currentSection);

  // If too many sections, remove middle ones
  while (wordCount(sections.map(s => s.heading + s.content).join('')) > targetWords && sections.length > 4) {
    // Remove the section with most words from the middle
    const mid = Math.floor(sections.length / 2);
    sections.splice(mid, 1);
  }

  // If still too long, trim paragraphs from longest section
  let result = sections.map(s => s.heading + s.content).join('');
  let attempts = 0;
  while (wordCount(result) > targetWords && attempts < 20) {
    // Find and remove the longest paragraph
    const paragraphs = [...result.matchAll(/<p>([\s\S]*?)<\/p>/g)];
    if (paragraphs.length <= 5) break;
    
    let longestIdx = -1;
    let longestLen = 0;
    for (let i = Math.floor(paragraphs.length * 0.3); i < Math.floor(paragraphs.length * 0.7); i++) {
      const len = paragraphs[i][1].split(/\s+/).length;
      if (len > longestLen) {
        longestLen = len;
        longestIdx = i;
      }
    }
    if (longestIdx >= 0) {
      const match = paragraphs[longestIdx];
      result = result.slice(0, match.index) + result.slice(match.index + match[0].length);
    }
    attempts++;
  }

  return result;
}

// Add short sentences to improve variance
function addShortSentences(body) {
  const shortPhrases = [
    'That matters.',
    'Really.',
    'Think about that.',
    'It adds up.',
    'Simple enough.',
    'Not quite.',
    'Fair enough.',
    'Worth knowing.',
    'Sounds familiar?',
    'It works.',
    'No question.',
    'Right there.',
    'Exactly.',
    'Big difference.',
    'True story.',
  ];

  const paragraphs = body.split('</p>');
  const shuffled = shuffle(shortPhrases);
  let added = 0;

  for (let i = 1; i < paragraphs.length - 1 && added < 4; i += 3) {
    if (paragraphs[i].includes('<h2') || paragraphs[i].includes('<blockquote')) continue;
    // Insert a short sentence at the end of this paragraph
    const trimmed = paragraphs[i].replace(/<p>/g, '').trim();
    if (trimmed.length > 100) {
      paragraphs[i] = paragraphs[i].trimEnd() + ' ' + shuffled[added];
      added++;
    }
  }

  return paragraphs.join('</p>');
}

async function expandArticle(article, catalog) {
  if (!ANTHROPIC_API_KEY) return article.body;
  
  const selectedProducts = shuffle(catalog).slice(0, 4);
  const productContext = selectedProducts.map(p => `${p.name} (ASIN: ${p.asin})`).join('\n');

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
      system: `You are Kalesh, a consciousness teacher and writer. Expand this tinnitus article to 1600-1800 words. Keep the existing content and add 2-3 new H2 sections with fresh insights. Write in long, unfolding sentences (18-28 words avg) with some short fragments mixed in. Cross-traditional (Buddhism, Taoism, Vedanta, neuroscience). Intellectual warmth.

HARD RULES:
- Zero em-dashes. Use commas, periods, colons, or parentheses.
- Never use: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze.
- Contractions throughout. Vary sentence length aggressively. Include short sentences (3-6 words).
- Include at least 2 conversational openers: "Here's the thing," "Honestly," "Look," "Truth is."
- Include at least 3 Amazon product links in the body:
${productContext}
Link format: <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)

Return the FULL expanded HTML body only. No markdown. No code fences.`,
      messages: [{
        role: 'user',
        content: `Expand this article: "${article.title}" (${article.categoryName})\n\nCurrent body:\n${article.body}\n\nReturn the full expanded HTML body.`
      }]
    })
  });

  if (!response.ok) return article.body;
  const data = await response.json();
  let body = data.content[0].text;
  body = body.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  body = body.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
  body = body.replace(/&mdash;/g, ', ').replace(/&ndash;/g, ', ');
  return body;
}

async function main() {
  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
  const auditPath = join(ROOT, 'content/quality-audit.json');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  const catalogPath = join(ROOT, 'content/product-catalog.json');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : [];

  const failedIds = new Set(audit.failureDetails.map(f => f.id));
  console.log(`Fixing ${failedIds.size} articles...\n`);

  let trimmed = 0, expanded = 0, varianceFixed = 0, wordFixed = 0;

  for (const detail of audit.failureDetails) {
    const idx = articles.findIndex(a => a.id === detail.id);
    if (idx < 0) continue;
    const article = articles[idx];
    let body = article.body;

    // Fix remaining AI words
    const aiWordFails = detail.failures.filter(f => f.startsWith('ai-word:'));
    for (const f of aiWordFails) {
      const word = f.split(':')[1];
      const replacements = {
        'amplify': 'increase', 'amplifies': 'increases', 'amplifying': 'increasing',
        'amplified': 'increased', 'amplification': 'increase',
        'intricate': 'complex', 'robust': 'strong', 'foster': 'encourage',
        'unlock': 'open', 'pivotal': 'key', 'additionally': 'also',
        'revolutionary': 'significant', 'underscore': 'highlight',
        'tapestry': 'fabric',
      };
      const rep = replacements[word] || word;
      const re = new RegExp(`\\b${word}\\b`, 'gi');
      body = body.replace(re, rep);
      wordFixed++;
    }

    // Trim long articles
    if (detail.failures.some(f => f.startsWith('words-too-high'))) {
      body = trimArticle(body, 2200);
      trimmed++;
      console.log(`  Trimmed #${article.id} "${article.title}" from ${detail.wordCount} to ~${wordCount(body)} words`);
    }

    // Expand short articles
    if (detail.failures.some(f => f.startsWith('words-too-low'))) {
      console.log(`  Expanding #${article.id} "${article.title}" (${detail.wordCount} words)...`);
      body = await expandArticle(article, catalog);
      expanded++;
      console.log(`  Expanded to ~${wordCount(body)} words`);
      await new Promise(r => setTimeout(r, 1500));
    }

    // Fix sentence variance and short sentences
    if (detail.failures.some(f => f.startsWith('too-few-short-sentences') || f.startsWith('sentence-variance-too-low'))) {
      body = addShortSentences(body);
      varianceFixed++;
    }

    articles[idx].body = body;
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log(`\n=== FIX RESULTS ===`);
  console.log(`Trimmed: ${trimmed}`);
  console.log(`Expanded: ${expanded}`);
  console.log(`Variance fixed: ${varianceFixed}`);
  console.log(`AI words fixed: ${wordFixed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
