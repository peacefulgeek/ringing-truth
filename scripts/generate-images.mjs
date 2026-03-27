#!/usr/bin/env node
/**
 * Generate hero images and OG images for all 300 articles
 * Uses FAL.ai for generation, sharp for processing, Bunny CDN for storage
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const BUNNY_STORAGE_ZONE = "ringing-truth";
const BUNNY_STORAGE_HOST = "ny.storage.bunnycdn.com";
const BUNNY_STORAGE_PASSWORD = "282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772";
const BUNNY_CDN_BASE = "https://ringing-truth.b-cdn.net";

const CONTENT_DIR = join(process.cwd(), 'content');
const IMAGES_DIR = join(process.cwd(), 'tmp-images');
if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });

// Read all articles
const articles = JSON.parse(readFileSync(join(CONTENT_DIR, 'all-articles.json'), 'utf8'));

async function generateImage(prompt, articleId) {
  const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
  
  const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      image_size: { width: 1200, height: 675 },
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    // Try polling approach
    const queueData = await response.json();
    if (queueData.request_id) {
      // Poll for result
      let result;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${queueData.request_id}/status`, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const status = await statusRes.json();
        if (status.status === 'COMPLETED') {
          const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${queueData.request_id}`, {
            headers: { 'Authorization': `Key ${FAL_KEY}` },
          });
          result = await resultRes.json();
          break;
        }
      }
      if (result && result.images && result.images[0]) {
        return result.images[0].url;
      }
    }
    throw new Error(`FAL.ai error: ${response.status} ${JSON.stringify(queueData)}`);
  }

  const data = await response.json();
  if (data.images && data.images[0]) {
    return data.images[0].url;
  }
  if (data.request_id) {
    // Queue mode - poll
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${data.request_id}/status`, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const status = await statusRes.json();
      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${data.request_id}`, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const result = await resultRes.json();
        if (result.images && result.images[0]) {
          return result.images[0].url;
        }
      }
    }
  }
  throw new Error('No image URL in response');
}

async function downloadAndProcessImage(url, outputPath, width, height, format = 'webp') {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  if (format === 'webp') {
    await sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(outputPath);
  } else {
    await sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .png({ quality: 82 })
      .toFile(outputPath);
  }
}

async function uploadToBunny(localPath, remotePath) {
  const fileBuffer = readFileSync(localPath);
  const url = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${remotePath}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_STORAGE_PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  });
  
  if (!response.ok) {
    throw new Error(`Bunny upload failed: ${response.status} ${await response.text()}`);
  }
  
  return `${BUNNY_CDN_BASE}/${remotePath}`;
}

async function processArticle(article, index) {
  const slug = article.slug;
  const prompt = article.heroImagePrompt || `Luminous warm scene related to ${article.title}, golden light, peaceful, healing atmosphere, no text, no people in distress`;
  
  console.log(`[${index + 1}/300] Generating image for: ${article.title}`);
  
  try {
    // Generate hero image
    const imageUrl = await generateImage(prompt, article.id);
    
    // Download and process as WebP hero (1200x675)
    const heroPath = join(IMAGES_DIR, `${slug}-hero.webp`);
    await downloadAndProcessImage(imageUrl, heroPath, 1200, 675, 'webp');
    
    // Upload hero to Bunny CDN
    const heroRemote = `images/${slug}-hero.webp`;
    const heroCdnUrl = await uploadToBunny(heroPath, heroRemote);
    
    // Create OG image (1200x630 PNG)
    const ogPath = join(IMAGES_DIR, `${slug}-og.png`);
    await downloadAndProcessImage(imageUrl, ogPath, 1200, 630, 'png');
    
    // Upload OG to Bunny CDN
    const ogRemote = `images/${slug}-og.png`;
    const ogCdnUrl = await uploadToBunny(ogPath, ogRemote);
    
    return {
      id: article.id,
      slug,
      heroUrl: heroCdnUrl,
      ogUrl: ogCdnUrl,
      success: true,
    };
  } catch (error) {
    console.error(`  Error for ${slug}: ${error.message}`);
    return {
      id: article.id,
      slug,
      heroUrl: null,
      ogUrl: null,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  const startIdx = parseInt(process.argv[2] || '0');
  const endIdx = parseInt(process.argv[3] || String(articles.length));
  const batch = articles.slice(startIdx, endIdx);
  
  console.log(`Processing articles ${startIdx} to ${endIdx} (${batch.length} articles)`);
  
  const results = [];
  const concurrency = 3;
  
  for (let i = 0; i < batch.length; i += concurrency) {
    const chunk = batch.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((article, j) => processArticle(article, startIdx + i + j))
    );
    results.push(...chunkResults);
    
    // Brief pause between chunks
    if (i + concurrency < batch.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Save results
  const outputPath = join(CONTENT_DIR, `image-results-${startIdx}-${endIdx}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);
}

main().catch(console.error);
