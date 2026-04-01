// Redistribute outbound links across all 300 articles
// Target: 14% kalesh.love, 33% product (Amazon), 23% org nofollow, 30% internal only
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(ROOT, 'content/all-articles.json'), 'utf8'));
const total = articles.length; // 300

// Target counts
const kaleshCount = Math.round(total * 0.14); // 42
const productCount = Math.round(total * 0.33); // 99
const orgCount = Math.round(total * 0.23); // 69
const internalCount = total - kaleshCount - productCount - orgCount; // 90

console.log(`Target distribution: kalesh=${kaleshCount}, product=${productCount}, org=${orgCount}, internal=${internalCount}`);

// Amazon products relevant to tinnitus (real ASINs)
const AMAZON_PRODUCTS = [
  { asin: 'B07RWLJ5DB', name: 'LectroFan EVO White Noise Machine', anchor: 'a high-quality white noise machine' },
  { asin: 'B00MY0YB5E', name: 'Marpac Dohm Classic White Noise Machine', anchor: 'the Marpac Dohm sound machine' },
  { asin: 'B07N1XJ1C2', name: 'Loop Quiet Ear Plugs', anchor: 'Loop Quiet noise-reducing ear plugs' },
  { asin: 'B0CX23V2ZK', name: 'Sony WH-1000XM5 Headphones', anchor: 'noise-cancelling headphones' },
  { asin: 'B09XS7JWHH', name: 'Apple AirPods Pro', anchor: 'AirPods Pro with active noise cancellation' },
  { asin: 'B0D1XD1ZV3', name: 'Bose QuietComfort Ultra Earbuds', anchor: 'Bose QuietComfort noise-cancelling earbuds' },
  { asin: 'B0CKWDS3QM', name: 'Magnesium Glycinate Supplement', anchor: 'a magnesium glycinate supplement' },
  { asin: 'B08FMHP3N5', name: 'Tinnitus: A Storm Within by Pawel Jastreboff', anchor: 'Jastreboff\'s foundational text on tinnitus' },
  { asin: 'B07D23CFGR', name: 'Wherever You Go There You Are by Jon Kabat-Zinn', anchor: 'Jon Kabat-Zinn\'s mindfulness classic' },
  { asin: 'B00HE67WQQ', name: 'Waking Up by Sam Harris', anchor: 'Sam Harris\'s guide to meditation and consciousness' },
  { asin: 'B005LFYGJQ', name: 'The Power of Now by Eckhart Tolle', anchor: 'Eckhart Tolle\'s The Power of Now' },
  { asin: 'B0797YBP7N', name: 'Meditation Cushion Zafu', anchor: 'a quality meditation cushion' },
  { asin: 'B07BFNLMLH', name: 'Yoga Mat Extra Thick', anchor: 'a supportive yoga mat for body practices' },
  { asin: 'B09DFCB66S', name: 'Theragun Mini Massage Gun', anchor: 'a percussion massage device for tension relief' },
  { asin: 'B07L6MHFQ3', name: 'Pillow Speaker for Sleep', anchor: 'a pillow speaker for nighttime sound therapy' },
  { asin: 'B0B5F76FB4', name: 'Melatonin Sleep Gummies', anchor: 'melatonin gummies for sleep support' },
  { asin: 'B074BDJFHX', name: 'The Body Keeps the Score by Bessel van der Kolk', anchor: 'The Body Keeps the Score' },
  { asin: 'B01LXIA9FG', name: 'Calm App Gift Card', anchor: 'the Calm meditation app' },
  { asin: 'B0BX7GKBCP', name: 'Blue Light Blocking Glasses', anchor: 'blue light blocking glasses for better sleep' },
  { asin: 'B08HMWZBXC', name: 'Journaling Notebook', anchor: 'a dedicated journaling notebook' },
  { asin: 'B0BDJ3GG9W', name: 'Lavender Essential Oil', anchor: 'lavender essential oil for relaxation' },
  { asin: 'B07PFFMP9P', name: 'Weighted Blanket', anchor: 'a weighted blanket for nervous system regulation' },
  { asin: 'B0C1JB3GZH', name: 'Noise-Cancelling Sleep Earbuds', anchor: 'sleep earbuds with noise cancellation' },
  { asin: 'B0BSHF7WHW', name: 'Acupressure Mat', anchor: 'an acupressure mat for stress relief' },
  { asin: 'B08MQZYSVC', name: 'Breathwork Training Device', anchor: 'a breathwork training device' },
  { asin: 'B0BVMKTTQN', name: 'Herbal Tea Sampler for Sleep', anchor: 'an herbal tea sampler for better sleep' },
  { asin: 'B0752FL328', name: 'Full Catastrophe Living by Jon Kabat-Zinn', anchor: 'Full Catastrophe Living by Kabat-Zinn' },
  { asin: 'B00GFIVTLK', name: 'Tinnitus Miracle by Thomas Coleman', anchor: 'a comprehensive tinnitus management guide' },
  { asin: 'B07VYBKGXP', name: 'Hearing Protection Ear Muffs', anchor: 'professional hearing protection ear muffs' },
  { asin: 'B0C5KG6CFH', name: 'Sound Therapy Speaker', anchor: 'a dedicated sound therapy speaker' },
];

const ORG_SITES = [
  { url: 'https://www.ata.org', anchor: 'the American Tinnitus Association' },
  { url: 'https://www.ncbi.nlm.nih.gov', anchor: 'the National Library of Medicine' },
  { url: 'https://www.mayoclinic.org/diseases-conditions/tinnitus', anchor: 'the Mayo Clinic\'s tinnitus resource' },
  { url: 'https://www.nidcd.nih.gov/health/tinnitus', anchor: 'the National Institute on Deafness' },
  { url: 'https://www.asha.org', anchor: 'the American Speech-Language-Hearing Association' },
  { url: 'https://www.health.harvard.edu', anchor: 'Harvard Health Publishing' },
  { url: 'https://pubmed.ncbi.nlm.nih.gov', anchor: 'PubMed research database' },
  { url: 'https://www.bta.org.uk', anchor: 'the British Tinnitus Association' },
  { url: 'https://www.who.int/health-topics/hearing-loss', anchor: 'the World Health Organization' },
  { url: 'https://www.hearingloss.org', anchor: 'the Hearing Loss Association of America' },
];

const KALESH_ANCHORS = [
  'Kalesh\'s work on consciousness and healing',
  'Kalesh\'s exploration of awareness and sound',
  'the deeper inquiry Kalesh writes about',
  'Kalesh\'s approach to embodied awareness',
  'what Kalesh calls the space between stimulus and response',
  'Kalesh\'s writing on presence and perception',
  'the contemplative perspective Kalesh offers',
  'Kalesh\'s insights on the nervous system and awareness',
  'the intersection of science and contemplation that Kalesh explores',
  'Kalesh\'s guide to living with awareness',
];

// Shuffle articles for random assignment
const shuffled = articles.map((a, i) => i);
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}

const kaleshIndices = new Set(shuffled.slice(0, kaleshCount));
const productIndices = new Set(shuffled.slice(kaleshCount, kaleshCount + productCount));
const orgIndices = new Set(shuffled.slice(kaleshCount + productCount, kaleshCount + productCount + orgCount));
// Rest are internal only

let kaleshDone = 0, productDone = 0, orgDone = 0, internalDone = 0;

for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  let body = a.body;

  // First, strip existing outbound links (kalesh.love, external nofollow, amazon)
  // Keep internal links (/articles/...) intact
  body = body.replace(/<a\s+href="https?:\/\/[^"]*"[^>]*>([^<]*)<\/a>/gi, (match, text) => {
    // Keep internal links
    if (match.includes('href="/')) return match;
    // Remove external links, keep text
    return text;
  });

  // Now add the appropriate outbound link based on assignment
  if (kaleshIndices.has(i)) {
    // Add kalesh.love link
    const anchor = KALESH_ANCHORS[kaleshDone % KALESH_ANCHORS.length];
    const linkHtml = `<p>For those drawn to this kind of inquiry, <a href="https://kalesh.love">${anchor}</a> offers a path worth exploring.</p>`;
    // Insert before last </p>
    const lastP = body.lastIndexOf('</p>');
    if (lastP > 0) {
      body = body.slice(0, lastP + 4) + linkHtml;
    } else {
      body += linkHtml;
    }
    a.linkType = 'kalesh';
    kaleshDone++;
  } else if (productIndices.has(i)) {
    // Add Amazon product link
    const product = AMAZON_PRODUCTS[productDone % AMAZON_PRODUCTS.length];
    const linkHtml = `<p>A resource worth considering: <a href="https://www.amazon.com/dp/${product.asin}?tag=spankyspinola-20">${product.anchor}</a> (paid link) — many readers have found it genuinely helpful.</p>`;
    const lastP = body.lastIndexOf('</p>');
    if (lastP > 0) {
      body = body.slice(0, lastP + 4) + linkHtml;
    } else {
      body += linkHtml;
    }
    a.linkType = 'product';
    a.hasAffiliateLink = true;
    productDone++;
  } else if (orgIndices.has(i)) {
    // Add org nofollow link
    const org = ORG_SITES[orgDone % ORG_SITES.length];
    const linkHtml = `<p>For further reading, <a href="${org.url}" rel="nofollow">${org.anchor}</a> provides authoritative information on this topic.</p>`;
    const lastP = body.lastIndexOf('</p>');
    if (lastP > 0) {
      body = body.slice(0, lastP + 4) + linkHtml;
    } else {
      body += linkHtml;
    }
    a.linkType = 'org';
    orgDone++;
  } else {
    a.linkType = 'internal';
    internalDone++;
  }

  a.body = body;
}

writeFileSync(join(ROOT, 'content/all-articles.json'), JSON.stringify(articles, null, 2));

console.log(`Redistribution complete:`);
console.log(`  Kalesh: ${kaleshDone} (${Math.round(kaleshDone/total*100)}%)`);
console.log(`  Product: ${productDone} (${Math.round(productDone/total*100)}%)`);
console.log(`  Org: ${orgDone} (${Math.round(orgDone/total*100)}%)`);
console.log(`  Internal: ${internalDone} (${Math.round(internalDone/total*100)}%)`);
console.log(`  Total: ${kaleshDone + productDone + orgDone + internalDone}`);
