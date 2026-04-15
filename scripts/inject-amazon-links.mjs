import { readFileSync, writeFileSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const products = JSON.parse(readFileSync('content/product-catalog.json', 'utf8'));
const TAG = 'spankyspinola-20';

// Topic matching: map article category + keywords to product categories
const categoryProductMap = {
  'The Science': ['supplements', 'books', 'hearing-protection', 'sound-therapy'],
  'The Management': ['sound-therapy', 'headphones', 'hearing-protection', 'body-tools', 'sleep'],
  'The Mind': ['books', 'meditation-tech', 'journaling', 'aromatherapy'],
  'The Body': ['body-tools', 'movement', 'supplements', 'wearables', 'sleep'],
  'The Deeper Listening': ['meditation-tech', 'books', 'aromatherapy', 'journaling'],
};

// Keyword matching for more precise product selection
const keywordProductMap = {
  'sleep': ['sleep', 'sound-therapy'],
  'meditation': ['meditation-tech', 'books', 'aromatherapy'],
  'anxiety': ['supplements', 'meditation-tech', 'books', 'aromatherapy'],
  'stress': ['supplements', 'body-tools', 'aromatherapy', 'wearables'],
  'sound': ['sound-therapy', 'headphones', 'hearing-protection'],
  'noise': ['sound-therapy', 'headphones', 'hearing-protection'],
  'hearing': ['hearing-protection', 'sound-therapy', 'supplements'],
  'supplement': ['supplements'],
  'vitamin': ['supplements'],
  'magnesium': ['supplements'],
  'zinc': ['supplements'],
  'exercise': ['movement', 'body-tools', 'wearables'],
  'yoga': ['movement', 'meditation-tech', 'books'],
  'breathing': ['meditation-tech', 'books', 'movement'],
  'cbt': ['books'],
  'therapy': ['books', 'body-tools'],
  'massage': ['body-tools'],
  'neck': ['body-tools'],
  'jaw': ['body-tools'],
  'tmj': ['body-tools'],
  'posture': ['body-tools', 'movement'],
  'journal': ['journaling'],
  'mindful': ['meditation-tech', 'books', 'journaling'],
  'brain': ['supplements', 'books', 'wearables'],
  'nerve': ['supplements', 'body-tools'],
  'ear': ['hearing-protection', 'sound-therapy', 'supplements'],
  'music': ['headphones', 'hearing-protection', 'sound-therapy'],
  'relax': ['aromatherapy', 'body-tools', 'sleep'],
  'calm': ['aromatherapy', 'supplements', 'meditation-tech'],
  'focus': ['headphones', 'supplements', 'meditation-tech'],
  'pain': ['body-tools', 'supplements'],
  'inflammation': ['supplements'],
  'gut': ['supplements'],
  'diet': ['supplements'],
  'acceptance': ['books', 'meditation-tech'],
  'consciousness': ['books', 'meditation-tech'],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Track product usage to distribute evenly
const productUsage = {};
products.forEach(p => productUsage[p.asin] = 0);

function getMatchingProducts(article, count) {
  const title = (article.title || '').toLowerCase();
  const category = article.categoryName || '';
  
  // Score each product
  const scored = products.map(p => {
    let score = 0;
    
    // Category match
    const catProducts = categoryProductMap[category] || [];
    if (catProducts.includes(p.category)) score += 2;
    
    // Keyword match from title
    for (const [kw, cats] of Object.entries(keywordProductMap)) {
      if (title.includes(kw)) {
        if (cats.includes(p.category)) score += 3;
      }
    }
    
    // Tag match
    for (const tag of p.tags) {
      if (title.includes(tag.toLowerCase())) score += 2;
    }
    
    // Penalize overused products
    score -= (productUsage[p.asin] || 0) * 0.5;
    
    return { product: p, score };
  });
  
  // Sort by score descending, take top candidates, then shuffle top ones for variety
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, Math.min(20, scored.length));
  const selected = shuffle(topCandidates).slice(0, count);
  
  selected.forEach(s => productUsage[s.product.asin]++);
  
  return selected.map(s => s.product);
}

function buildAmazonLink(product) {
  return `<a href="https://www.amazon.com/dp/${product.asin}?tag=${TAG}" target="_blank" rel="nofollow noopener">${product.name}</a> (paid link)`;
}

function buildHealingJourneySection(matchedProducts) {
  if (matchedProducts.length === 0) return '';
  
  let html = `\n<h2>Your Healing Journey: Tools Worth Exploring</h2>\n`;
  html += `<p>While there is no single solution for tinnitus, many people find that the right combination of tools and practices makes a real difference in daily life. Here are some options that align with what we have discussed in this article.</p>\n`;
  
  for (const p of matchedProducts) {
    html += `<p>${p.sentence}. Check out the ${buildAmazonLink(p)} and see if it fits your situation.</p>\n`;
  }
  
  html += `<p><em>We may earn a small commission from Amazon purchases, which helps support this site at no extra cost to you.</em></p>\n`;
  
  return html;
}

// Process each article
let totalLinksInjected = 0;
let articlesWithLinks = 0;

for (const article of articles) {
  // Get 2-4 matching products
  const productCount = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  const matched = getMatchingProducts(article, productCount);
  
  if (matched.length === 0) continue;
  
  // Inject 1-2 inline links in the body
  let body = article.body || '';
  const inlineProducts = matched.slice(0, Math.min(2, matched.length));
  
  // Find good injection points (after </p> tags in the middle of the article)
  const pTags = [...body.matchAll(/<\/p>/g)];
  if (pTags.length >= 4) {
    // Inject first inline link after ~30% through
    const pos1 = Math.floor(pTags.length * 0.3);
    const insertPoint1 = pTags[pos1].index + 4;
    const inlineHtml1 = `\n<p>${inlineProducts[0].sentence}. Many readers have found the ${buildAmazonLink(inlineProducts[0])} helpful for this.</p>`;
    body = body.slice(0, insertPoint1) + inlineHtml1 + body.slice(insertPoint1);
    
    if (inlineProducts.length > 1) {
      // Inject second inline link after ~60% through (recalculate positions)
      const pTags2 = [...body.matchAll(/<\/p>/g)];
      const pos2 = Math.floor(pTags2.length * 0.6);
      const insertPoint2 = pTags2[pos2].index + 4;
      const inlineHtml2 = `\n<p>Another option worth considering is the ${buildAmazonLink(inlineProducts[1])}. ${inlineProducts[1].sentence}.</p>`;
      body = body.slice(0, insertPoint2) + inlineHtml2 + body.slice(insertPoint2);
    }
  }
  
  // Add Healing Journey section before FAQ (if exists) or at end
  const healingSection = buildHealingJourneySection(matched);
  
  const faqIdx = body.indexOf('<h2>Frequently Asked Questions</h2>');
  if (faqIdx > 0) {
    body = body.slice(0, faqIdx) + healingSection + '\n' + body.slice(faqIdx);
  } else {
    body += healingSection;
  }
  
  article.body = body;
  totalLinksInjected += matched.length;
  articlesWithLinks++;
}

// Save
writeFileSync('content/all-articles.json', JSON.stringify(articles));

console.log(`Injected ${totalLinksInjected} Amazon links across ${articlesWithLinks} articles`);
console.log(`Average links per article: ${(totalLinksInjected / articlesWithLinks).toFixed(1)}`);

// Check product distribution
const usageCounts = Object.values(productUsage);
const used = usageCounts.filter(c => c > 0).length;
console.log(`Products used: ${used}/${products.length}`);
console.log(`Max usage: ${Math.max(...usageCounts)}, Min usage: ${Math.min(...usageCounts.filter(c => c > 0))}`);
