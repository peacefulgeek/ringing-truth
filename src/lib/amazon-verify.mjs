const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const SOFT_404 = [
  /<title>[^<]*Page Not Found[^<]*<\/title>/i,
  /<title>[^<]*Sorry[^<]*<\/title>/i,
  /Looking for something\?[\s\S]{0,600}We're sorry/i,
  /The Web address you entered is not a functioning page/i,
  /Dogs of Amazon/i
];

const PRODUCT_SIG = [
  /id="productTitle"/,
  /id="titleSection"/,
  /name="ASIN"[^>]*value="[A-Z0-9]{10}"/,
  /data-asin="[A-Z0-9]{10}"/
];

export async function verifyAsin(asin) {
  if (!/^[A-Z0-9]{10}$/.test(asin)) return { asin, valid: false, reason: 'malformed' };
  const url = `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });
    if (res.status !== 200) return { asin, valid: false, reason: `http-${res.status}`, url };
    if (res.url.includes('/s?k=') || res.url.match(/amazon\.com\/?(\?|$)/)) {
      return { asin, valid: false, reason: 'redirected-to-search', url };
    }
    const html = await res.text();
    if (SOFT_404.some(p => p.test(html))) return { asin, valid: false, reason: 'soft-404', url };
    if (!PRODUCT_SIG.some(p => p.test(html))) return { asin, valid: false, reason: 'no-product-signature', url };
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*:\s*Amazon\.com.*$/i, '').trim();
    if (!title || title.length < 10) return { asin, valid: false, reason: 'no-title', url };
    return { asin, valid: true, title, url };
  } catch (err) {
    return { asin, valid: false, reason: `fetch-error: ${err.message}`, url };
  }
}

export async function verifyAsinBatch(asins, delayMs = 2000) {
  const results = [];
  for (const asin of asins) {
    results.push(await verifyAsin(asin));
    await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

export function buildAmazonUrl(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

const LINK_RE = /https:\/\/(?:www\.)?amazon\.com\/dp\/([A-Z0-9]{10})(?:\/[^"\s?]*)?(?:\?[^"\s]*)?/g;

export function countAmazonLinks(text) {
  return (text.match(LINK_RE) || []).length;
}

export function extractAsinsFromText(text) {
  const asins = new Set();
  let m;
  const re = /amazon\.com\/dp\/([A-Z0-9]{10})/g;
  while ((m = re.exec(text)) !== null) asins.add(m[1]);
  return [...asins];
}
