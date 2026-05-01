import { readFileSync, writeFileSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const queued = articles.filter(a => a.status === 'queued');

// Check image assignments
const withImage = queued.filter(a => a.heroImage && a.heroImage.includes('bunny'));
const withOg = queued.filter(a => a.ogImage && a.ogImage.includes('bunny'));
const noImage = queued.filter(a => !a.heroImage || !a.heroImage.includes('bunny'));

console.log('With Bunny hero image:', withImage.length);
console.log('With Bunny OG image:', withOg.length);
console.log('Missing Bunny image:', noImage.length);

if (noImage.length > 0) {
  console.log('Sample missing:', noImage[0].id, noImage[0].heroImage);
}

// Check if images use lib-XX.webp format
const libPattern = queued.filter(a => a.heroImage && a.heroImage.match(/lib-\d+\.webp/));
console.log('Using lib-XX.webp pattern:', libPattern.length);

// If images are missing, assign them from the 40 library images
const BUNNY_CDN = 'https://ringingtruth.b-cdn.net/images';
const LIB_COUNT = 40;

let fixed = 0;
for (const article of articles) {
  if (article.status !== 'queued') continue;
  if (!article.heroImage || !article.heroImage.includes('bunny')) {
    const libNum = ((article.id % LIB_COUNT) + 1).toString().padStart(2, '0');
    article.heroImage = `${BUNNY_CDN}/lib-${libNum}.webp`;
    article.ogImage = `${BUNNY_CDN}/lib-${libNum}.webp`;
    fixed++;
  }
}

if (fixed > 0) {
  writeFileSync('content/all-articles.json', JSON.stringify(articles, null, 2));
  console.log(`Fixed ${fixed} articles with Bunny CDN images`);
} else {
  console.log('All articles already have Bunny CDN images');
}
