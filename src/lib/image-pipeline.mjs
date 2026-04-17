import sharp from 'sharp';

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'ringing-truth';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';
const BUNNY_PULL_ZONE_URL = process.env.BUNNY_PULL_ZONE_URL || 'https://ringing-truth.b-cdn.net';

/**
 * Take a source image URL (from FAL or any source), fetch it, convert to WebP,
 * compress to under 200KB, upload to Bunny, return the CDN URL.
 */
export async function processAndUploadImage(sourceUrl, filename) {
  // 1. Fetch source
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const inputBuffer = Buffer.from(await res.arrayBuffer());

  // 2. Convert to WebP, start at quality 82, drop if over 200KB
  let quality = 82;
  let outBuffer;
  while (quality >= 50) {
    outBuffer = await sharp(inputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (outBuffer.length <= 200 * 1024) break;
    quality -= 8;
  }
  if (outBuffer.length > 200 * 1024) {
    // Still too big — force smaller width
    outBuffer = await sharp(inputBuffer)
      .resize({ width: 1200 })
      .webp({ quality: 70 })
      .toBuffer();
  }

  // 3. Upload to Bunny
  const safeName = filename.replace(/[^a-z0-9-_.]/gi, '-').toLowerCase();
  const finalName = safeName.endsWith('.webp') ? safeName : `${safeName}.webp`;
  const uploadUrl = `https://ny.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${finalName}`;

  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_API_KEY,
      'Content-Type': 'image/webp'
    },
    body: outBuffer
  });
  if (!upload.ok) throw new Error(`Bunny upload failed: ${upload.status} ${await upload.text()}`);

  return `${BUNNY_PULL_ZONE_URL}/${finalName}`;
}
