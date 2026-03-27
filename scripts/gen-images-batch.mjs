#!/usr/bin/env node
/**
 * Generate images for articles that don't have them yet
 * Uses FAL.ai flux/schnell, processes with sharp, uploads to Bunny CDN
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const BUNNY_STORAGE_PASSWORD = "282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772";
const BUNNY_CDN_BASE = "https://ringing-truth.b-cdn.net";
const BUNNY_UPLOAD_BASE = "https://ny.storage.bunnycdn.com/ringing-truth";

const TMP_DIR = join(process.cwd(), 'tmp-images');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Load existing image map
let imageMap = {};
try {
  imageMap = JSON.parse(readFileSync('content/image-map.json', 'utf8'));
} catch(e) {}

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const missing = articles.filter(a => !imageMap[a.slug]);

console.log(`Total articles: ${articles.length}`);
console.log(`Already have images: ${Object.keys(imageMap).length}`);
console.log(`Need to generate: ${missing.length}`);

const startIdx = parseInt(process.argv[2] || '0');
const count = parseInt(process.argv[3] || '50');
const batch = missing.slice(startIdx, startIdx + count);

console.log(`Processing batch: ${startIdx} to ${startIdx + batch.length}`);

async function generateWithFal(prompt) {
  const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!FAL_KEY) throw new Error('FAL_KEY not set');
  
  // Use synchronous endpoint
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: 1200, height: 675 },
      num_images: 1,
    }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FAL error ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  if (data.images && data.images[0]) return data.images[0].url;
  throw new Error('No image in response');
}

async function processAndUpload(imageUrl, slug) {
  // Download
  const res = await fetch(imageUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  
  // Hero WebP 1200x675
  const heroPath = join(TMP_DIR, `${slug}-hero.webp`);
  await sharp(buf).resize(1200, 675, { fit: 'cover' }).webp({ quality: 82 }).toFile(heroPath);
  
  // OG PNG 1200x630
  const ogPath = join(TMP_DIR, `${slug}-og.png`);
  await sharp(buf).resize(1200, 630, { fit: 'cover' }).png().toFile(ogPath);
  
  // Upload hero
  const heroData = readFileSync(heroPath);
  await fetch(`${BUNNY_UPLOAD_BASE}/images/${slug}-hero.webp`, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'application/octet-stream' },
    body: heroData,
  });
  
  // Upload OG
  const ogData = readFileSync(ogPath);
  await fetch(`${BUNNY_UPLOAD_BASE}/images/${slug}-og.png`, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'application/octet-stream' },
    body: ogData,
  });
  
  return {
    heroUrl: `${BUNNY_CDN_BASE}/images/${slug}-hero.webp`,
    ogUrl: `${BUNNY_CDN_BASE}/images/${slug}-og.png`,
  };
}

async function processOne(article) {
  const prompt = article.heroImagePrompt || `Luminous warm scene related to ${article.title}, golden light, peaceful healing atmosphere, no text, no people in distress`;
  
  try {
    const url = await generateWithFal(prompt);
    const result = await processAndUpload(url, article.slug);
    imageMap[article.slug] = result;
    console.log(`  ✓ ${article.id}: ${article.slug}`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${article.id}: ${e.message.substring(0, 80)}`);
    return false;
  }
}

async function main() {
  let success = 0, fail = 0;
  
  // Process 3 at a time
  for (let i = 0; i < batch.length; i += 3) {
    const chunk = batch.slice(i, i + 3);
    const results = await Promise.all(chunk.map(a => processOne(a)));
    success += results.filter(r => r).length;
    fail += results.filter(r => !r).length;
    
    // Save progress
    writeFileSync('content/image-map.json', JSON.stringify(imageMap, null, 2));
    
    if (i + 3 < batch.length) await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nBatch complete: ${success} success, ${fail} failed`);
  console.log(`Total images now: ${Object.keys(imageMap).length}`);
}

main().catch(console.error);
