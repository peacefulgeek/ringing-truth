// Image pipeline: Bunny CDN library rotation
// Zero Fal.ai. Zero external image generation APIs.
// Uses pre-uploaded library of 40 niche-specific images on Bunny CDN.

const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';
const BUNNY_CDN_BASE = 'https://ringing-truth.b-cdn.net';
const LIBRARY_SIZE = 40;

/**
 * Assign a library image to an article slug.
 * Copies a random image from /library/ to /images/{slug}-hero.webp and /images/{slug}-og.webp
 * @param {string} slug - The article slug
 * @returns {Promise<{heroUrl: string, ogUrl: string}>}
 */
export async function assignLibraryImage(slug) {
  const libraryIndex = Math.floor(Math.random() * LIBRARY_SIZE) + 1;
  const sourceFile = `library/lib-${String(libraryIndex).padStart(2, '0')}.webp`;
  const destHero = `images/${slug}-hero.webp`;
  const destOg = `images/${slug}-og.webp`;

  try {
    const sourceUrl = `${BUNNY_CDN_BASE}/${sourceFile}`;
    const imgBuffer = await fetch(sourceUrl).then(r => {
      if (!r.ok) throw new Error(`Library image fetch failed: ${r.status}`);
      return r.arrayBuffer();
    });

    // Upload as hero
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destHero}`, {
      method: 'PUT',
      headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });

    // Upload as OG
    await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destOg}`, {
      method: 'PUT',
      headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
      body: Buffer.from(imgBuffer)
    });

    console.log(`[image-pipeline] Assigned ${sourceFile} → ${slug}`);
    return {
      heroUrl: `${BUNNY_CDN_BASE}/${destHero}`,
      ogUrl: `${BUNNY_CDN_BASE}/${destOg}`
    };
  } catch (e) {
    console.error(`[image-pipeline] Failed: ${e.message}`);
    return {
      heroUrl: `${BUNNY_CDN_BASE}/images/default-hero.webp`,
      ogUrl: `${BUNNY_CDN_BASE}/images/default-og.webp`
    };
  }
}

/**
 * Upload a raw buffer to Bunny CDN storage.
 * @param {Buffer} buffer - The image buffer
 * @param {string} destPath - Destination path in storage zone (e.g., "library/lib-01.webp")
 * @returns {Promise<string>} The CDN URL
 */
export async function uploadToBunny(buffer, destPath) {
  const res = await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${destPath}`, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_STORAGE_PASSWORD, 'Content-Type': 'image/webp' },
    body: buffer
  });
  if (!res.ok) throw new Error(`Bunny upload failed: ${res.status}`);
  return `${BUNNY_CDN_BASE}/${destPath}`;
}
