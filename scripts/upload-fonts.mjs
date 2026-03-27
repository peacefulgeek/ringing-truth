const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_STORAGE_ZONE = 'ringing-truth';
const BUNNY_STORAGE_PASSWORD = '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772';

const FONTS = [
  { name: 'Figtree-Regular', url: 'https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2' },
  { name: 'Figtree-Medium', url: 'https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2' },
  { name: 'Figtree-SemiBold', url: 'https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2' },
  { name: 'Figtree-Bold', url: 'https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DQ.woff2' },
  { name: 'Literata-Regular', url: 'https://fonts.gstatic.com/s/literata/v40/or3aQ6P12-iJxAIgLa78DkrbXsDgk0oVDaDPYLanFLHpPf2TbBG_df3-vbgKBM6YoggA-vpO-7c.woff2' },
  { name: 'Literata-Bold', url: 'https://fonts.gstatic.com/s/literata/v40/or3aQ6P12-iJxAIgLa78DkrbXsDgk0oVDaDPYLanFLHpPf2TbBG_df3-vbgKBM6YoggA-vpO-7c.woff2' },
  { name: 'Literata-Italic', url: 'https://fonts.gstatic.com/s/literata/v40/or3NQ6P12-iJxAIgLYT1PLs1Zd0nfUwAbeGVKoRYzNiCp1OUedn8_7XmTkiS.woff2' },
];

async function uploadFont(font) {
  try {
    console.log(`Downloading ${font.name}...`);
    const response = await fetch(font.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    console.log(`Uploading ${font.name} to Bunny CDN (${buffer.length} bytes)...`);
    const uploadResponse = await fetch(
      `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/fonts/${font.name}.woff2`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_PASSWORD,
          'Content-Type': 'font/woff2',
        },
        body: buffer,
      }
    );
    
    if (uploadResponse.ok || uploadResponse.status === 201) {
      console.log(`✓ ${font.name} uploaded`);
    } else {
      console.error(`✗ ${font.name} upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
    }
  } catch (e) {
    console.error(`✗ ${font.name} error: ${e.message}`);
  }
}

async function main() {
  for (const font of FONTS) {
    await uploadFont(font);
  }
  
  // Also upload a default Kalesh avatar
  console.log('Creating and uploading Kalesh avatar...');
  try {
    const { createCanvas } = await import('canvas').catch(() => null);
    // Create a simple gradient avatar using sharp
    const sharp = (await import('sharp')).default;
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#008080"/>
          <stop offset="100%" style="stop-color:#006666"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#g)"/>
      <text x="100" y="115" text-anchor="middle" font-family="serif" font-size="72" fill="white" font-weight="bold">K</text>
    </svg>`;
    
    const avatarBuffer = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
    
    const uploadResponse = await fetch(
      `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/images/kalesh-avatar.webp`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_PASSWORD,
          'Content-Type': 'image/webp',
        },
        body: avatarBuffer,
      }
    );
    
    if (uploadResponse.ok || uploadResponse.status === 201) {
      console.log('✓ Kalesh avatar uploaded');
    } else {
      console.error(`✗ Avatar upload failed: ${uploadResponse.status}`);
    }
  } catch (e) {
    console.error(`✗ Avatar error: ${e.message}`);
  }

  // Upload default OG image
  console.log('Creating and uploading default OG image...');
  try {
    const sharp = (await import('sharp')).default;
    const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#008080"/>
          <stop offset="50%" style="stop-color:#006666"/>
          <stop offset="100%" style="stop-color:#004d4d"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="600" y="280" text-anchor="middle" font-family="serif" font-size="64" fill="white" font-weight="bold">The Ringing Truth</text>
      <text x="600" y="350" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#F5DEB3">Living with Tinnitus Without Losing Your Mind</text>
      <text x="600" y="420" text-anchor="middle" font-family="serif" font-size="22" fill="#E8927C" font-style="italic">The ringing won't stop. But the suffering can.</text>
    </svg>`;
    
    const ogBuffer = await sharp(Buffer.from(ogSvg)).png().toBuffer();
    
    const uploadResponse = await fetch(
      `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/images/og-default.png`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_PASSWORD,
          'Content-Type': 'image/png',
        },
        body: ogBuffer,
      }
    );
    
    if (uploadResponse.ok || uploadResponse.status === 201) {
      console.log('✓ Default OG image uploaded');
    } else {
      console.error(`✗ OG upload failed: ${uploadResponse.status}`);
    }
  } catch (e) {
    console.error(`✗ OG error: ${e.message}`);
  }
  
  console.log('All done!');
}

main();
