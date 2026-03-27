import express from 'express';
import compression from 'compression';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── COMPRESSION & SECURITY ───
app.use(compression());
app.use((req, res, next) => {
  res.setHeader('X-AI-Content-Author', 'Kalesh');
  res.setHeader('X-AI-Content-Site', 'The Ringing Truth');
  res.setHeader('X-AI-Identity-Endpoint', '/api/ai/identity');
  res.setHeader('X-AI-LLMs-Txt', '/llms.txt');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ─── STATIC FILES ───
app.use('/assets', express.static(join(__dirname, 'dist/assets'), {
  maxAge: '1y', immutable: true
}));
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));
app.use(express.json());

// ─── LOAD DATA ───
const SITE = {
  title: 'The Ringing Truth',
  subtitle: 'Living with Tinnitus Without Losing Your Mind',
  tagline: 'The ringing won\'t stop. But the suffering can.',
  domain: 'ringingtruth.com',
  url: 'https://ringingtruth.com',
  author: 'The Ringing Truth Editorial',
  authorPerson: 'Kalesh',
  authorTitle: 'Consciousness Teacher & Writer',
  authorBio: 'Kalesh is a consciousness teacher and writer whose work explores the intersection of ancient contemplative traditions and modern neuroscience. With decades of practice in meditation, breathwork, and somatic inquiry, he guides others toward embodied awareness.',
  authorLink: 'https://kalesh.love',
  colors: { primary: '#008080', secondary: '#F5DEB3', accent: '#E8927C' },
  cdnBase: 'https://ringing-truth.b-cdn.net'
};

const CATEGORIES = [
  { slug: 'the-science', name: 'The Science' },
  { slug: 'the-management', name: 'The Management' },
  { slug: 'the-mind', name: 'The Mind' },
  { slug: 'the-body', name: 'The Body' },
  { slug: 'the-deeper-listening', name: 'The Deeper Listening' },
];

let articles = [];
let imageMap = {};

function loadData() {
  try {
    articles = JSON.parse(readFileSync(join(__dirname, 'content/all-articles.json'), 'utf8'));
    imageMap = JSON.parse(readFileSync(join(__dirname, 'content/image-map.json'), 'utf8'));
  } catch (e) {
    console.error('Error loading data:', e.message);
  }
}
loadData();

function filterPublished(arts) {
  const now = new Date();
  return arts.filter(a => new Date(a.dateISO) <= now);
}

function getPublished() {
  return filterPublished(articles).sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
}

function getArticlesByCategory(slug) {
  return getPublished().filter(a => a.category === slug);
}

function getImageUrl(slug, type = 'hero') {
  const img = imageMap[slug];
  if (img) return type === 'hero' ? img.heroUrl : img.ogUrl;
  return `${SITE.cdnBase}/images/${slug}-${type === 'hero' ? 'hero.webp' : 'og.png'}`;
}

// ─── TEMPLATE ENGINE ───
function layout(title, description, content, options = {}) {
  const published = getPublished();
  const count = published.length;
  const ogImage = options.ogImage || `${SITE.cdnBase}/images/og-default.png`;
  const canonical = options.canonical || SITE.url;
  const jsonLd = options.jsonLd || '';
  const bodyClass = options.bodyClass || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="${SITE.author}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="${SITE.colors.primary}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="${SITE.title}" href="${SITE.url}/feed.xml">
  <meta property="og:type" content="${options.ogType || 'website'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${SITE.title}">
  ${options.ogType === 'article' ? `<meta property="article:author" content="${SITE.author}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <style>
    @font-face { font-family: 'Literata'; src: url('${SITE.cdnBase}/fonts/Literata-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Literata'; src: url('${SITE.cdnBase}/fonts/Literata-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Literata'; src: url('${SITE.cdnBase}/fonts/Literata-Italic.woff2') format('woff2'); font-weight: 400; font-style: italic; font-display: swap; }
    @font-face { font-family: 'Figtree'; src: url('${SITE.cdnBase}/fonts/Figtree-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Figtree'; src: url('${SITE.cdnBase}/fonts/Figtree-Medium.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Figtree'; src: url('${SITE.cdnBase}/fonts/Figtree-SemiBold.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Figtree'; src: url('${SITE.cdnBase}/fonts/Figtree-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 18px; line-height: 1.7; color: #1a1a2e; background: #fafaf8; }
    h1, h2, h3, h4 { font-family: 'Literata', Georgia, serif; line-height: 1.3; color: #1a1a2e; }
    a { color: ${SITE.colors.primary}; text-decoration: none; transition: color 0.2s; }
    a:hover { color: ${SITE.colors.accent}; }
    img { max-width: 100%; height: auto; }

    /* Navigation */
    .site-nav { background: #fff; border-bottom: 1px solid #e8e8e0; position: sticky; top: 0; z-index: 100; }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem; text-align: center; }
    .site-name { font-family: 'Literata', serif; font-size: 1.5rem; font-weight: 700; color: #1a1a2e; display: block; margin-bottom: 0.5rem; }
    .site-name a { color: inherit; }
    .cat-tabs { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }
    .cat-tab { padding: 0.4rem 1rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 500; color: #666; background: #f5f5f0; transition: all 0.2s; }
    .cat-tab:hover, .cat-tab.active { background: ${SITE.colors.primary}; color: #fff; }

    /* Hero */
    .hero { position: relative; height: 70vh; min-height: 400px; display: flex; align-items: center; justify-content: center; text-align: center; color: #fff; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,128,128,0.6) 0%, rgba(26,26,46,0.7) 100%); }
    .hero-content { position: relative; z-index: 2; padding: 2rem; max-width: 700px; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: 0.5rem; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .hero p { font-size: clamp(1rem, 2vw, 1.3rem); opacity: 0.9; }
    .hero .tagline { font-style: italic; margin-top: 1rem; font-size: 1.1rem; opacity: 0.85; }

    /* Masonry Grid */
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
    .section-title { font-size: 1.8rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 3px solid ${SITE.colors.primary}; }
    .masonry { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .card-img { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; }
    .card-gradient { position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; background: linear-gradient(transparent, rgba(0,0,0,0.7)); }
    .card-title { color: #fff; font-family: 'Literata', serif; font-size: 1rem; line-height: 1.3; }
    .cat-pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background: ${SITE.colors.accent}; color: #fff; margin-top: 0.5rem; }

    /* Newsletter */
    .newsletter { background: linear-gradient(135deg, ${SITE.colors.primary}, #006666); color: #fff; padding: 3rem 2rem; border-radius: 12px; text-align: center; margin: 2rem 0; }
    .newsletter h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .newsletter p { opacity: 0.9; margin-bottom: 1.5rem; }
    .newsletter-form { display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto; }
    .newsletter-form input { flex: 1; padding: 0.8rem 1rem; border: none; border-radius: 8px; font-size: 1rem; }
    .newsletter-form button { padding: 0.8rem 1.5rem; background: ${SITE.colors.accent}; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .newsletter-form button:hover { background: #d4785e; }
    .newsletter-success { display: none; font-size: 1.1rem; margin-top: 1rem; }

    /* Article Page */
    .article-layout { display: grid; grid-template-columns: 1fr 340px; gap: 3rem; max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
    .article-main { min-width: 0; }
    .article-hero { width: 100%; border-radius: 12px; margin-bottom: 1.5rem; }
    .article-meta { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .article-date { color: #888; font-size: 0.9rem; }
    .reading-time { color: #888; font-size: 0.9rem; }
    .toc { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; padding: 1rem; background: #f8f8f5; border-radius: 8px; }
    .toc a { padding: 0.3rem 0.8rem; background: #fff; border-radius: 2rem; font-size: 0.8rem; border: 1px solid #e0e0d8; }
    .toc a:hover { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }
    .article-body { font-size: 18px; line-height: 1.7; }
    .article-body h2 { font-size: 1.6rem; margin: 2em 0 0.8em; padding-top: 1em; border-top: 1px solid #eee; }
    .article-body h2:first-of-type { border-top: none; padding-top: 0; }
    .article-body p { margin-bottom: 1.5em; }
    .article-body blockquote { border-left: 4px solid ${SITE.colors.primary}; padding: 1rem 1.5rem; margin: 1.5em 0; background: #f8f8f5; border-radius: 0 8px 8px 0; font-style: italic; }
    .article-body ul, .article-body ol { margin: 1em 0 1.5em 1.5em; }
    .article-body li { margin-bottom: 0.5em; }
    .article-body a { color: ${SITE.colors.primary}; text-decoration: underline; text-underline-offset: 2px; }

    /* Share Buttons */
    .share-buttons { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .share-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; border: 1px solid #ddd; background: #fff; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.3rem; }
    .share-btn:hover { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* Sidebar */
    .article-sidebar { position: sticky; top: 80px; align-self: start; }
    .sidebar-section { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .sidebar-section h3 { font-size: 1rem; margin-bottom: 1rem; color: ${SITE.colors.primary}; }
    .sidebar-article { display: flex; gap: 0.8rem; margin-bottom: 1rem; }
    .sidebar-article img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
    .sidebar-article-title { font-size: 0.85rem; line-height: 1.3; }

    /* Cross Links */
    .cross-links { margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #eee; }
    .cross-links h2 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .cross-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }

    /* Bio Card */
    .bio-card { background: #f8f8f5; border-radius: 12px; padding: 1.5rem; margin-top: 3rem; display: flex; gap: 1.5rem; align-items: flex-start; }
    .bio-card img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .bio-name { font-family: 'Literata', serif; font-weight: 700; margin-bottom: 0.3rem; }
    .bio-title { font-size: 0.85rem; color: ${SITE.colors.primary}; margin-bottom: 0.5rem; }
    .bio-text { font-size: 0.9rem; color: #555; margin-bottom: 0.8rem; }
    .bio-link { display: inline-block; padding: 0.4rem 1rem; background: ${SITE.colors.primary}; color: #fff; border-radius: 6px; font-size: 0.85rem; font-weight: 500; }
    .bio-link:hover { background: #006666; color: #fff; }

    /* FAQ */
    .faq-section { margin-top: 2rem; }
    .faq-item { border: 1px solid #eee; border-radius: 8px; margin-bottom: 0.8rem; overflow: hidden; }
    .faq-q { padding: 1rem 1.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fafaf8; }
    .faq-q:hover { background: #f0f0e8; }
    .faq-a { padding: 0 1.5rem 1rem; display: none; }
    .faq-item.open .faq-a { display: block; }
    .faq-item.open .faq-arrow { transform: rotate(180deg); }
    .faq-arrow { transition: transform 0.2s; }

    /* Footer */
    .site-footer { background: #1a1a2e; color: #ccc; padding: 3rem 1.5rem 1.5rem; margin-top: 4rem; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .footer-col h4 { color: #fff; margin-bottom: 1rem; font-size: 1rem; }
    .footer-col a { color: #aaa; display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .footer-col a:hover { color: ${SITE.colors.accent}; }
    .footer-bottom { max-width: 1200px; margin: 2rem auto 0; padding-top: 1.5rem; border-top: 1px solid #333; text-align: center; font-size: 0.85rem; color: #888; }
    .disclaimer { font-size: 0.8rem; color: #999; margin-top: 1rem; max-width: 800px; margin-left: auto; margin-right: auto; }

    /* Cookie Banner */
    .cookie-banner { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a2e; color: #fff; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem; z-index: 1000; font-size: 0.9rem; }
    .cookie-banner.hidden { display: none; }
    .cookie-btn { padding: 0.5rem 1.5rem; background: ${SITE.colors.primary}; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }

    /* Filter tabs */
    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .filter-btn { padding: 0.5rem 1.2rem; border-radius: 2rem; border: 1px solid #ddd; background: #fff; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
    .filter-btn.active, .filter-btn:hover { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* Search */
    .search-bar { margin-bottom: 2rem; }
    .search-bar input { width: 100%; padding: 0.8rem 1.2rem; border: 2px solid #e0e0d8; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; }
    .search-bar input:focus { outline: none; border-color: ${SITE.colors.primary}; }

    /* Pages */
    .page-content { max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; }
    .page-content h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .page-content h2 { font-size: 1.5rem; margin: 2rem 0 1rem; }
    .page-content p { margin-bottom: 1.5em; }

    /* Quiz */
    .quiz-container { max-width: 700px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .quiz-progress { height: 6px; background: #eee; border-radius: 3px; margin-bottom: 2rem; overflow: hidden; }
    .quiz-progress-bar { height: 100%; background: ${SITE.colors.primary}; transition: width 0.3s; border-radius: 3px; }
    .quiz-question { font-family: 'Literata', serif; font-size: 1.3rem; margin-bottom: 1.5rem; }
    .quiz-options { display: grid; gap: 0.8rem; }
    .quiz-option { padding: 1rem 1.5rem; border: 2px solid #e0e0d8; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 1rem; text-align: left; background: #fff; }
    .quiz-option:hover { border-color: ${SITE.colors.primary}; background: #f0fafa; }
    .quiz-option:focus { outline: 2px solid ${SITE.colors.primary}; outline-offset: 2px; }
    .quiz-result { text-align: center; }
    .quiz-result h2 { margin-bottom: 1rem; }
    .quiz-share { margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center; }

    /* Sound Match */
    .sound-match { max-width: 800px; margin: 2rem auto; }
    .sm-step { margin-bottom: 2rem; }
    .sm-label { font-family: 'Literata', serif; font-size: 1.2rem; margin-bottom: 1rem; }
    .sm-options { display: flex; flex-wrap: wrap; gap: 0.8rem; }
    .sm-option { padding: 0.8rem 1.5rem; border: 2px solid #e0e0d8; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .sm-option.selected { border-color: ${SITE.colors.primary}; background: ${SITE.colors.primary}; color: #fff; }
    .sm-results { margin-top: 2rem; padding: 2rem; background: #f8f8f5; border-radius: 12px; }

    /* About */
    .advisor-card { display: flex; gap: 2rem; padding: 2rem; background: #f8f8f5; border-radius: 12px; margin-top: 2rem; align-items: flex-start; }
    .advisor-card img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }

    /* 404 */
    .error-page { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
    .error-page h1 { font-size: 4rem; color: ${SITE.colors.primary}; }
    .error-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem; max-width: 900px; }

    /* Mobile Bottom Bar */
    .mobile-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e8e8e0; z-index: 100; }
    .mobile-bar-inner { display: flex; justify-content: space-around; padding: 0.5rem 0; }
    .mobile-bar a { display: flex; flex-direction: column; align-items: center; font-size: 0.7rem; color: #666; padding: 0.3rem; min-width: 44px; min-height: 44px; justify-content: center; }
    .mobile-bar a.active { color: ${SITE.colors.primary}; }
    .mobile-bar svg { width: 22px; height: 22px; margin-bottom: 2px; }

    /* Responsive */
    @media (max-width: 1024px) {
      .masonry { grid-template-columns: repeat(2, 1fr); }
      .article-layout { grid-template-columns: 1fr; }
      .article-sidebar { position: static; }
      .footer-inner { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .masonry { grid-template-columns: 1fr; }
      .cross-grid { grid-template-columns: 1fr; }
      .error-grid { grid-template-columns: repeat(2, 1fr); }
      .hero { height: 50vh; }
      .cat-tabs { display: none; }
      .mobile-bar { display: block; }
      body { padding-bottom: 60px; }
      .newsletter-form { flex-direction: column; }
      .bio-card { flex-direction: column; text-align: center; align-items: center; }
      .advisor-card { flex-direction: column; text-align: center; align-items: center; }
    }
    @media (max-width: 414px) {
      body { font-size: 16px; }
      .container { padding: 1rem; }
    }
  </style>
  ${jsonLd}
</head>
<body class="${bodyClass}">
  <!-- Navigation -->
  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">
      <span class="site-name"><a href="/">${SITE.title}</a></span>
      <div class="cat-tabs">
        ${CATEGORIES.map(c => `<a href="/category/${c.slug}" class="cat-tab">${c.name}</a>`).join('')}
      </div>
    </div>
  </nav>

  ${content}

  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col">
        <h4>${SITE.title}</h4>
        <p style="font-size:0.85rem;color:#999;margin-bottom:1rem">${SITE.subtitle}</p>
        <a href="/start-here">Start Here</a>
        <a href="/about">About</a>
        <a href="/articles">All Articles</a>
        <a href="/sound-match">Sound Match Tool</a>
      </div>
      <div class="footer-col">
        <h4>Categories</h4>
        ${CATEGORIES.map(c => `<a href="/category/${c.slug}">${c.name}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/quizzes">Quizzes</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${SITE.title}. All rights reserved.</p>
      <p class="disclaimer">The information on this site is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding tinnitus or any medical condition.</p>
    </div>
  </footer>

  <!-- Mobile Bottom Bar -->
  <div class="mobile-bar">
    <div class="mobile-bar-inner">
      <a href="/" aria-label="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Home</a>
      <a href="/articles" aria-label="Browse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Browse</a>
      <a href="/articles?search=true" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Search</a>
      <a href="/about" aria-label="About"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>About</a>
      <a href="/quizzes" aria-label="More"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>More</a>
    </div>
  </div>

  <!-- Cookie Banner -->
  <div class="cookie-banner" id="cookieBanner">
    <span>We use cookies to improve your experience. By continuing, you agree to our <a href="/privacy" style="color:${SITE.colors.accent}">Privacy Policy</a>.</span>
    <button class="cookie-btn" onclick="document.getElementById('cookieBanner').classList.add('hidden');localStorage.setItem('cookieConsent','1')">Accept</button>
  </div>
  <script>if(localStorage.getItem('cookieConsent'))document.getElementById('cookieBanner').classList.add('hidden');</script>

  <!-- Newsletter JS -->
  <script>
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      const source = form.dataset.source || 'unknown';
      try {
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source })
        });
      } catch(e) {}
      form.style.display = 'none';
      form.nextElementSibling.style.display = 'block';
    });
  });
  </script>

  <!-- FAQ Toggle -->
  <script>
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
    q.addEventListener('keydown', (e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();q.parentElement.classList.toggle('open');} });
  });
  </script>
</body>
</html>`;
}

function articleCard(a) {
  const img = getImageUrl(a.slug, 'hero');
  return `<a href="/articles/${a.slug}" class="card">
    <div class="card-img">
      <img src="${img}" alt="${a.title}" width="400" height="300" loading="lazy">
      <div class="card-gradient">
        <div class="card-title">${a.title}</div>
        <span class="cat-pill">${a.categoryName}</span>
      </div>
    </div>
  </a>`;
}

// ─── ROUTES ───

// Homepage
app.get('/', (req, res) => {
  const published = getPublished();
  const featured = published.slice(0, 1)[0];
  const grid = published.slice(0, 12);
  const count = published.length;

  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    url: SITE.url,
    description: SITE.subtitle,
    potentialAction: { "@type": "SearchAction", target: `${SITE.url}/articles?q={search_term_string}`, "query-input": "required name=search_term_string" }
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.title,
    url: SITE.url,
    description: `${SITE.title} — ${SITE.subtitle}`
  })}</script>`;

  const heroImg = featured ? getImageUrl(featured.slug, 'hero') : '';
  const content = `
    <section class="hero">
      ${featured ? `<div class="hero-bg" style="background-image:url('${heroImg}')"></div>` : ''}
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>${SITE.title}</h1>
        <p>${SITE.subtitle}</p>
        <p class="tagline">${SITE.tagline}</p>
      </div>
    </section>

    <div class="container">
      <div class="filter-bar">
        <button class="filter-btn active" data-cat="all">All (${count})</button>
        ${CATEGORIES.map(c => {
          const catCount = getArticlesByCategory(c.slug).length;
          return `<button class="filter-btn" data-cat="${c.slug}">${c.name} (${catCount})</button>`;
        }).join('')}
      </div>

      <div class="masonry" id="articleGrid">
        ${grid.slice(0, 3).map(a => articleCard(a)).join('')}
      </div>

      <div class="newsletter" style="margin:2rem 0">
        <h2>Stay Connected</h2>
        <p>Join our community of people learning to live well with tinnitus.</p>
        <form class="newsletter-form" data-source="homepage">
          <input type="email" placeholder="Your email address" required aria-label="Email address">
          <button type="submit">Join</button>
        </form>
        <p class="newsletter-success">Thanks for subscribing!</p>
      </div>

      <div class="masonry">
        ${grid.slice(3).map(a => articleCard(a)).join('')}
      </div>
    </div>

    <script>
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        window.location.href = cat === 'all' ? '/articles' : '/category/' + cat;
      });
    });
    </script>`;

  res.send(layout(
    `${SITE.title} — ${SITE.subtitle}`,
    SITE.tagline,
    content,
    { canonical: SITE.url, jsonLd }
  ));
});

// Articles listing
app.get('/articles', (req, res) => {
  const published = getPublished();
  const q = (req.query.q || '').toLowerCase();
  const filtered = q ? published.filter(a =>
    a.title.toLowerCase().includes(q) || (a.metaDescription || '').toLowerCase().includes(q)
  ) : published;

  const content = `
    <div class="container">
      <h1 class="section-title">All Articles (${published.length})</h1>
      <div class="search-bar">
        <input type="text" placeholder="Search articles..." value="${q}" id="searchInput" aria-label="Search articles">
      </div>
      <div class="filter-bar">
        <button class="filter-btn active" data-cat="all">All</button>
        ${CATEGORIES.map(c => `<button class="filter-btn" data-cat="${c.slug}">${c.name}</button>`).join('')}
      </div>
      <div class="masonry" id="articleGrid">
        ${filtered.map(a => articleCard(a)).join('')}
      </div>
    </div>
    <script>
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      window.location.href = '/articles?q=' + encodeURIComponent(q);
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        window.location.href = cat === 'all' ? '/articles' : '/category/' + cat;
      });
    });
    </script>`;

  res.send(layout(
    `Articles — ${SITE.title}`,
    `Browse all ${published.length} articles about living with tinnitus.`,
    content,
    { canonical: `${SITE.url}/articles` }
  ));
});

// Category pages
app.get('/category/:slug', (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug);
  if (!cat) return res.status(404).send(render404());

  const catArticles = getArticlesByCategory(cat.slug);
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cat.name,
    url: `${SITE.url}/category/${cat.slug}`,
    description: `${cat.name} articles about tinnitus from ${SITE.title}`,
    numberOfItems: catArticles.length
  })}</script>`;

  const content = `
    <div class="container">
      <h1 class="section-title">${cat.name} (${catArticles.length})</h1>
      <div class="masonry">
        ${catArticles.map(a => articleCard(a)).join('')}
      </div>
    </div>`;

  res.send(layout(
    `${cat.name} — ${SITE.title}`,
    `Explore ${catArticles.length} articles in ${cat.name} from ${SITE.title}.`,
    content,
    { canonical: `${SITE.url}/category/${cat.slug}`, jsonLd }
  ));
});

// Article page
app.get('/articles/:slug', (req, res) => {
  const article = articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).send(render404());
  if (new Date(article.dateISO) > new Date()) return res.status(404).send(render404());

  const heroUrl = getImageUrl(article.slug, 'hero');
  const ogUrl = getImageUrl(article.slug, 'og');
  const published = getPublished();
  const sameCat = published.filter(a => a.category === article.category && a.slug !== article.slug).slice(0, 4);
  const crossCat = published.filter(a => a.category !== article.category && a.slug !== article.slug).slice(0, 4);
  const popular = published.filter(a => a.slug !== article.slug).slice(0, 5);

  // Extract H2s for ToC
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  let h2s = [];
  let match;
  let bodyWithIds = article.body;
  let idx = 0;
  while ((match = h2Regex.exec(article.body)) !== null) {
    const id = `section-${idx}`;
    const text = match[1].replace(/<[^>]+>/g, '');
    h2s.push({ id, text });
    bodyWithIds = bodyWithIds.replace(match[0], `<h2 id="${id}">${match[1]}</h2>`);
    idx++;
  }

  // FAQ section
  let faqHtml = '';
  let faqSchema = '';
  if (article.faqs && article.faqs.length > 0) {
    faqHtml = `<div class="faq-section"><h2 id="faq">Frequently Asked Questions</h2>
      ${article.faqs.map(f => `<div class="faq-item">
        <div class="faq-q" tabindex="0" role="button" aria-expanded="false">${f.question}<span class="faq-arrow">▼</span></div>
        <div class="faq-a"><p>${f.answer}</p></div>
      </div>`).join('')}</div>`;

    faqSchema = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqs.map(f => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer }
      }))
    })}</script>`;
  }

  const articleSchema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    image: heroUrl,
    datePublished: article.dateISO,
    dateModified: article.dateISO,
    author: { "@type": "Person", name: "Kalesh" },
    publisher: { "@type": "Organization", name: SITE.title, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/articles/${article.slug}`,
    speakable: { "@type": "SpeakableSpecification", cssSelector: [".article-body h2", ".article-body p:first-of-type"] }
  })}</script>`;

  const breadcrumbSchema = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: article.categoryName, item: `${SITE.url}/category/${article.category}` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${SITE.url}/articles/${article.slug}` }
    ]
  })}</script>`;

  const content = `
    <div class="article-layout">
      <main class="article-main">
        <img src="${heroUrl}" alt="${article.title}" width="1200" height="675" class="article-hero">
        <h1>${article.title}</h1>
        <div class="article-meta">
          <a href="/category/${article.category}" class="cat-pill">${article.categoryName}</a>
          <span class="article-date">${new Date(article.dateISO).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span class="reading-time">${article.readingTime || 10} min read</span>
        </div>

        <div class="share-buttons">
          <button class="share-btn" aria-label="Copy link" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='Copied!'">📋 Copy Link</button>
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE.url + '/articles/' + article.slug)}&text=${encodeURIComponent(article.title)}" class="share-btn" aria-label="Share on X" rel="nofollow noopener" target="_blank">𝕏 Share</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE.url + '/articles/' + article.slug)}" class="share-btn" aria-label="Share on Facebook" rel="nofollow noopener" target="_blank">f Share</a>
        </div>

        ${h2s.length > 0 ? `<div class="toc">${h2s.map(h => `<a href="#${h.id}">${h.text}</a>`).join('')}</div>` : ''}

        <div class="article-body">${bodyWithIds}</div>

        ${faqHtml}

        <div class="cross-links">
          <h2>Keep Reading</h2>
          <div class="cross-grid">
            ${crossCat.slice(0, 4).map(a => articleCard(a)).join('')}
          </div>
        </div>

        <div class="bio-card">
          <img src="${SITE.cdnBase}/images/kalesh-avatar.webp" alt="Kalesh" width="80" height="80">
          <div>
            <div class="bio-name">Kalesh</div>
            <div class="bio-title">${SITE.authorTitle}</div>
            <p class="bio-text">${SITE.authorBio}</p>
            <a href="${SITE.authorLink}" class="bio-link">Visit Kalesh's Website</a>
          </div>
        </div>
      </main>

      <aside class="article-sidebar">
        <div class="sidebar-section">
          <h3>In ${article.categoryName}</h3>
          ${sameCat.map(a => `<a href="/articles/${a.slug}" class="sidebar-article">
            <img src="${getImageUrl(a.slug, 'hero')}" alt="${a.title}" width="80" height="60" loading="lazy">
            <span class="sidebar-article-title">${a.title}</span>
          </a>`).join('')}
        </div>
        <div class="sidebar-section">
          <h3>Popular Articles</h3>
          ${popular.map(a => `<a href="/articles/${a.slug}" class="sidebar-article">
            <img src="${getImageUrl(a.slug, 'hero')}" alt="${a.title}" width="80" height="60" loading="lazy">
            <span class="sidebar-article-title">${a.title}</span>
          </a>`).join('')}
        </div>
      </aside>
    </div>`;

  res.send(layout(
    `${article.title} — ${SITE.title}`,
    article.metaDescription || article.title,
    content,
    {
      canonical: `${SITE.url}/articles/${article.slug}`,
      ogImage: ogUrl,
      ogType: 'article',
      jsonLd: articleSchema + breadcrumbSchema + faqSchema
    }
  ));
});

// Start Here
app.get('/start-here', (req, res) => {
  const published = getPublished();
  const pillars = [];
  for (const cat of CATEGORIES) {
    const catArts = published.filter(a => a.category === cat.slug);
    if (catArts.length > 0) pillars.push(catArts[0]);
  }

  const content = `
    <div class="page-content">
      <h1>Start Here</h1>
      <p>Welcome to ${SITE.title}. If you're new to tinnitus — or new to the idea that you can live well with it — this is where your journey begins.</p>
      <p>${SITE.tagline}</p>
      <p>We've curated these foundational articles to give you a clear path forward. Each one addresses a different dimension of the tinnitus experience — from the neuroscience behind the sound to the deeper questions about awareness and presence that tinnitus inevitably raises.</p>
      <h2>Your Essential Reading Path</h2>
      <div class="masonry" style="margin-top:1.5rem">
        ${pillars.map(a => articleCard(a)).join('')}
      </div>
      <div class="newsletter" style="margin-top:3rem">
        <h2>Join Our Community</h2>
        <p>Stay connected with new insights on living well with tinnitus.</p>
        <form class="newsletter-form" data-source="start-here">
          <input type="email" placeholder="Your email address" required aria-label="Email address">
          <button type="submit">Join</button>
        </form>
        <p class="newsletter-success">Thanks for subscribing!</p>
      </div>
    </div>`;

  res.send(layout(
    `Start Here — ${SITE.title}`,
    'New to tinnitus? Start here with our curated guide to understanding and living well with tinnitus.',
    content,
    { canonical: `${SITE.url}/start-here` }
  ));
});

// About
app.get('/about', (req, res) => {
  const published = getPublished();
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Kalesh",
      jobTitle: "Consciousness Teacher & Writer",
      url: SITE.authorLink,
      description: SITE.authorBio
    }
  })}</script>`;

  const content = `
    <div class="page-content">
      <h1>About ${SITE.title}</h1>
      <p>${SITE.title} is an independent resource dedicated to helping people understand, manage, and ultimately make peace with tinnitus. We publish evidence-based articles that weave together neuroscience, clinical research, and contemplative wisdom — because tinnitus is not just an ear problem. It is a whole-person experience.</p>
      <p>Our editorial team draws on decades of combined experience in audiology research, mindfulness practice, and health communication. Every article is reviewed for accuracy, compassion, and practical value. We believe that the ringing doesn't have to define your life — and that real relief often comes from unexpected directions.</p>
      <p>With ${published.length} articles and growing, we cover everything from the latest research on neuroplasticity and sound therapy to the deeper questions about awareness, presence, and what it means to truly listen.</p>

      <h2>Our Consciousness Advisor</h2>
      <div class="advisor-card">
        <img src="${SITE.cdnBase}/images/kalesh-avatar.webp" alt="Kalesh" width="120" height="120">
        <div>
          <h3 style="margin-bottom:0.3rem">Kalesh</h3>
          <p style="color:${SITE.colors.primary};margin-bottom:0.8rem">${SITE.authorTitle}</p>
          <p>${SITE.authorBio}</p>
          <a href="${SITE.authorLink}" style="display:inline-block;margin-top:1rem;padding:0.5rem 1.2rem;background:${SITE.colors.primary};color:#fff;border-radius:6px">Visit Kalesh's Website</a>
        </div>
      </div>
    </div>`;

  res.send(layout(
    `About — ${SITE.title}`,
    `Learn about ${SITE.title} and our mission to help people live well with tinnitus.`,
    content,
    { canonical: `${SITE.url}/about`, jsonLd }
  ));
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  const content = `
    <div class="page-content">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <h2>Information We Collect</h2>
      <p>When you subscribe to our newsletter, we collect your email address. This information is stored securely on Bunny CDN storage infrastructure. We do not use databases, and we do not share your email with third parties.</p>
      <h2>How We Use Your Information</h2>
      <p>Email addresses collected through our subscription forms are stored for potential future communications about tinnitus resources and site updates. Currently, we do not send automated emails.</p>
      <h2>Data Storage</h2>
      <p>Your data is stored on Bunny CDN, a content delivery network with servers distributed globally. We do not use traditional databases, third-party email marketing services, or analytics platforms.</p>
      <h2>Cookies</h2>
      <p>We use minimal cookies to remember your cookie consent preference. We do not use tracking cookies, analytics cookies, or third-party advertising cookies.</p>
      <h2>Third-Party Services</h2>
      <p>We use Bunny CDN for content delivery and data storage. No other third-party services process your personal data.</p>
      <h2>Your Rights</h2>
      <p>You have the right to request access to, correction of, or deletion of your personal data. Under GDPR and similar regulations, you may also object to processing or request data portability.</p>
      <h2>Contact</h2>
      <p>For privacy-related inquiries, please reach out through the channels listed on our About page.</p>
    </div>`;

  res.send(layout(
    `Privacy Policy — ${SITE.title}`,
    `Privacy policy for ${SITE.title}. Learn how we handle your data.`,
    content,
    { canonical: `${SITE.url}/privacy` }
  ));
});

// Terms of Service
app.get('/terms', (req, res) => {
  const content = `
    <div class="page-content">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <h2>Educational Purpose</h2>
      <p>The content on ${SITE.title} is provided for educational and informational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician, audiologist, or other qualified health provider with any questions you may have regarding tinnitus or any medical condition.</p>
      <h2>No Professional Advice</h2>
      <p>Nothing on this website constitutes medical, therapeutic, or professional advice. The articles, quizzes, and tools are designed to inform and support — not to diagnose or treat any condition.</p>
      <h2>Intellectual Property</h2>
      <p>All content on ${SITE.title}, including articles, images, and design elements, is protected by copyright. You may share links to our content but may not reproduce it without permission.</p>
      <h2>Limitation of Liability</h2>
      <p>${SITE.title} and its contributors shall not be liable for any damages arising from the use of this website or reliance on its content.</p>
      <h2>Changes to Terms</h2>
      <p>We reserve the right to update these terms at any time. Continued use of the site constitutes acceptance of any changes.</p>
    </div>`;

  res.send(layout(
    `Terms of Service — ${SITE.title}`,
    `Terms of service for ${SITE.title}.`,
    content,
    { canonical: `${SITE.url}/terms` }
  ));
});

// Sound Match Interactive Tool
app.get('/sound-match', (req, res) => {
  const content = `
    <div class="container">
      <h1 class="section-title">Find Your Sound Therapy</h1>
      <p style="margin-bottom:2rem;max-width:700px">Describe your tinnitus experience below, and we'll suggest sound therapy approaches and masking strategies that may help. This tool is for educational purposes — always consult with an audiologist for personalized treatment.</p>

      <div class="sound-match" id="soundMatch">
        <div class="sm-step">
          <div class="sm-label">What does your tinnitus sound like?</div>
          <div class="sm-options" data-field="tone">
            <button class="sm-option" data-value="ringing">Ringing</button>
            <button class="sm-option" data-value="buzzing">Buzzing</button>
            <button class="sm-option" data-value="hissing">Hissing</button>
            <button class="sm-option" data-value="clicking">Clicking</button>
            <button class="sm-option" data-value="roaring">Roaring</button>
            <button class="sm-option" data-value="humming">Humming</button>
          </div>
        </div>

        <div class="sm-step">
          <div class="sm-label">What pitch is it?</div>
          <div class="sm-options" data-field="pitch">
            <button class="sm-option" data-value="high">High-pitched</button>
            <button class="sm-option" data-value="mid">Mid-range</button>
            <button class="sm-option" data-value="low">Low-pitched</button>
          </div>
        </div>

        <div class="sm-step">
          <div class="sm-label">Is it steady or pulsing?</div>
          <div class="sm-options" data-field="pattern">
            <button class="sm-option" data-value="steady">Steady / Constant</button>
            <button class="sm-option" data-value="pulsing">Pulsing / Rhythmic</button>
            <button class="sm-option" data-value="intermittent">Comes and Goes</button>
          </div>
        </div>

        <div class="sm-step">
          <div class="sm-label">Which ear(s)?</div>
          <div class="sm-options" data-field="ears">
            <button class="sm-option" data-value="left">Left ear</button>
            <button class="sm-option" data-value="right">Right ear</button>
            <button class="sm-option" data-value="both">Both ears</button>
            <button class="sm-option" data-value="head">Inside my head</button>
          </div>
        </div>

        <button id="smSubmit" style="margin-top:1.5rem;padding:0.8rem 2rem;background:${SITE.colors.primary};color:#fff;border:none;border-radius:8px;font-size:1.1rem;cursor:pointer;font-weight:600">Find My Sound Therapy</button>

        <div class="sm-results" id="smResults" style="display:none"></div>
      </div>
    </div>

    <script>
    const selections = {};
    document.querySelectorAll('.sm-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.parentElement.dataset.field;
        btn.parentElement.querySelectorAll('.sm-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selections[field] = btn.dataset.value;
      });
    });

    document.getElementById('smSubmit').addEventListener('click', () => {
      const results = document.getElementById('smResults');
      const therapies = [];

      if (selections.tone === 'ringing' || selections.pitch === 'high') {
        therapies.push({ name: 'Notched Sound Therapy', desc: 'Customized audio with a frequency notch at your tinnitus pitch. Research by Okamoto et al. shows this can reduce tinnitus perception over time by retraining auditory cortex neurons.' });
      }
      if (selections.pattern === 'steady') {
        therapies.push({ name: 'White Noise Masking', desc: 'Broadband white noise can effectively mask steady tinnitus. Use a dedicated sound machine or app at a volume just below your tinnitus level — the goal is partial masking, not complete coverage.' });
      }
      if (selections.pattern === 'pulsing') {
        therapies.push({ name: 'Pulsatile Tinnitus Evaluation', desc: 'Pulsing tinnitus that matches your heartbeat may have a vascular cause. Consider seeing an ENT specialist. In the meantime, nature sounds with rhythmic patterns (ocean waves, rainfall) may provide relief.' });
      }
      therapies.push({ name: 'Tinnitus Retraining Therapy (TRT)', desc: 'Developed by Pawel Jastreboff, TRT combines sound therapy with directive counseling. It works by habituating both the perception and reaction to tinnitus over 12-24 months.' });
      if (selections.tone === 'buzzing' || selections.tone === 'humming') {
        therapies.push({ name: 'Pink Noise Therapy', desc: 'Pink noise emphasizes lower frequencies and can be more soothing than white noise for buzzing or humming tinnitus. It mimics natural sound patterns and is gentler on the auditory system.' });
      }
      therapies.push({ name: 'Mindfulness-Based Sound Meditation', desc: 'Rather than fighting the sound, mindfulness approaches teach you to observe tinnitus without resistance. Research shows this can significantly reduce tinnitus distress even when the sound persists.' });

      results.style.display = 'block';
      results.innerHTML = '<h2 style="margin-bottom:1rem">Your Personalized Recommendations</h2>' +
        therapies.map(t => '<div style="margin-bottom:1.5rem"><h3 style="color:${SITE.colors.primary};margin-bottom:0.3rem">' + t.name + '</h3><p>' + t.desc + '</p></div>').join('') +
        '<p style="margin-top:1.5rem;padding:1rem;background:#fff;border-radius:8px;font-size:0.9rem"><strong>Important:</strong> These suggestions are educational starting points. Please consult with an audiologist or ENT specialist for a personalized treatment plan.</p>';
      results.scrollIntoView({ behavior: 'smooth' });
    });
    </script>`;

  res.send(layout(
    `Find Your Sound Therapy — ${SITE.title}`,
    'Describe your tinnitus and discover personalized sound therapy approaches and masking strategies.',
    content,
    { canonical: `${SITE.url}/sound-match` }
  ));
});

// Quizzes listing
app.get('/quizzes', (req, res) => {
  const quizzes = getQuizzes();
  const content = `
    <div class="container">
      <h1 class="section-title">Tinnitus Quizzes</h1>
      <p style="margin-bottom:2rem">Test your knowledge, understand your experience, and discover new perspectives on living with tinnitus.</p>
      <div class="masonry">
        ${quizzes.map(q => `<a href="/quiz/${q.slug}" class="card" style="padding:1.5rem">
          <h3 style="font-size:1.1rem;margin-bottom:0.5rem">${q.title}</h3>
          <p style="font-size:0.9rem;color:#666">${q.description}</p>
          <span class="cat-pill" style="margin-top:0.8rem">${q.questions.length} Questions</span>
        </a>`).join('')}
      </div>
    </div>`;

  res.send(layout(
    `Quizzes — ${SITE.title}`,
    'Take our tinnitus quizzes to test your knowledge and understand your experience better.',
    content,
    { canonical: `${SITE.url}/quizzes` }
  ));
});

// Individual quiz
app.get('/quiz/:slug', (req, res) => {
  const quizzes = getQuizzes();
  const quiz = quizzes.find(q => q.slug === req.params.slug);
  if (!quiz) return res.status(404).send(render404());

  const ogImage = `${SITE.cdnBase}/images/quiz-${quiz.slug}-og.png`;

  const content = `
    <div class="container">
      <div class="quiz-container" id="quizApp" data-quiz='${JSON.stringify(quiz).replace(/'/g, "&#39;")}'>
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem">${quiz.title}</h1>
        <p style="color:#666;margin-bottom:1.5rem">${quiz.description}</p>
        <div class="quiz-progress"><div class="quiz-progress-bar" id="progressBar" style="width:0%"></div></div>
        <div id="quizContent"></div>
      </div>
    </div>

    <script>
    (function() {
      const quiz = JSON.parse(document.getElementById('quizApp').dataset.quiz);
      const container = document.getElementById('quizContent');
      const progressBar = document.getElementById('progressBar');
      let current = 0;
      const answers = [];

      function showQuestion() {
        if (current >= quiz.questions.length) return showResult();
        const q = quiz.questions[current];
        progressBar.style.width = ((current / quiz.questions.length) * 100) + '%';
        container.innerHTML = '<div class="quiz-question">' + q.question + '</div>' +
          '<div class="quiz-options">' + q.options.map((opt, i) =>
            '<button class="quiz-option" tabindex="0" data-idx="' + i + '">' + opt.text + '</button>'
          ).join('') + '</div>';
        container.querySelectorAll('.quiz-option').forEach(btn => {
          btn.addEventListener('click', () => { answers.push(parseInt(btn.dataset.idx)); current++; showQuestion(); });
          btn.addEventListener('keydown', (e) => { if(e.key==='Enter'){btn.click();} });
        });
      }

      function showResult() {
        progressBar.style.width = '100%';
        let score = 0;
        quiz.questions.forEach((q, i) => { if (q.options[answers[i]] && q.options[answers[i]].correct) score++; });
        const pct = Math.round((score / quiz.questions.length) * 100);
        let message = pct >= 80 ? quiz.results.high : pct >= 50 ? quiz.results.medium : quiz.results.low;

        container.innerHTML = '<div class="quiz-result">' +
          '<h2>Your Score: ' + score + '/' + quiz.questions.length + ' (' + pct + '%)</h2>' +
          '<p style="margin:1rem 0;font-size:1.1rem">' + message + '</p>' +
          '<div class="quiz-share">' +
            '<button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href)">📋 Copy Link</button>' +
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent('I scored ' + pct + '% on ' + quiz.title + ' at ' + '${SITE.title}') + '&url=' + encodeURIComponent('${SITE.url}/quiz/' + quiz.slug) + '" class="share-btn" rel="nofollow noopener" target="_blank">𝕏 Share</a>' +
          '</div>' +
          '<div class="newsletter" style="margin-top:2rem"><h3>Want more tinnitus insights?</h3>' +
            '<form class="newsletter-form" data-source="quiz-' + quiz.slug + '">' +
              '<input type="email" placeholder="Your email" required aria-label="Email">' +
              '<button type="submit">Join</button>' +
            '</form><p class="newsletter-success">Thanks for subscribing!</p></div>' +
        '</div>';
      }

      showQuestion();
    })();
    </script>`;

  res.send(layout(
    `${quiz.title} — ${SITE.title}`,
    quiz.description,
    content,
    { canonical: `${SITE.url}/quiz/${quiz.slug}`, ogImage }
  ));
});

// Quiz result page (shareable)
app.get('/quiz/:slug/result', (req, res) => {
  res.redirect(`/quiz/${req.params.slug}`);
});

// ─── API ROUTES ───

// Email subscription
app.post('/api/subscribe', async (req, res) => {
  const { email, source } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const entry = JSON.stringify({
    email,
    date: new Date().toISOString(),
    source: source || 'unknown'
  });

  try {
    const response = await fetch(`https://ny.storage.bunnycdn.com/ringing-truth/data/subscribers.jsonl`, {
      method: 'PUT',
      headers: {
        'AccessKey': '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772',
        'Content-Type': 'application/octet-stream',
      },
      body: entry + '\n',
    });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true }); // Still show success to user
  }
});

// AI Endpoints
app.get('/llms.txt', (req, res) => {
  const published = getPublished();
  res.type('text/plain').send(`# ${SITE.title}
# ${SITE.subtitle}
# Author: Kalesh — ${SITE.authorTitle}
# URL: ${SITE.url}
# Articles: ${published.length}

## About
${SITE.title} is an independent resource dedicated to helping people understand, manage, and make peace with tinnitus. We publish evidence-based articles weaving neuroscience, clinical research, and contemplative wisdom.

## Topics
${CATEGORIES.map(c => `- ${c.name}: ${getArticlesByCategory(c.slug).length} articles`).join('\n')}

## Contact
Website: ${SITE.authorLink}

## Endpoints
- ${SITE.url}/.well-known/ai.json
- ${SITE.url}/api/ai/identity
- ${SITE.url}/api/ai/topics
- ${SITE.url}/api/ai/ask
- ${SITE.url}/api/ai/articles
- ${SITE.url}/api/ai/sitemap
- ${SITE.url}/feed.xml
`);
});

app.get('/.well-known/ai.json', (req, res) => {
  const published = getPublished();
  res.json({
    schema_version: "1.0",
    name: SITE.title,
    description: SITE.subtitle,
    url: SITE.url,
    author: { name: "Kalesh", title: SITE.authorTitle, url: SITE.authorLink },
    topics: CATEGORIES.map(c => c.name),
    article_count: published.length,
    endpoints: {
      identity: "/api/ai/identity",
      topics: "/api/ai/topics",
      ask: "/api/ai/ask",
      articles: "/api/ai/articles",
      sitemap: "/api/ai/sitemap"
    }
  });
});

app.get('/api/ai/identity', (req, res) => {
  res.json({
    name: SITE.title,
    author: "Kalesh",
    author_title: SITE.authorTitle,
    author_url: SITE.authorLink,
    description: `${SITE.title} — ${SITE.subtitle}. ${SITE.tagline}`,
    url: SITE.url,
    article_count: getPublished().length
  });
});

app.get('/api/ai/topics', (req, res) => {
  res.json({
    topics: CATEGORIES.map(c => ({
      name: c.name,
      slug: c.slug,
      article_count: getArticlesByCategory(c.slug).length,
      url: `${SITE.url}/category/${c.slug}`
    }))
  });
});

app.get('/api/ai/ask', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const published = getPublished();
  const matches = published.filter(a =>
    a.title.toLowerCase().includes(q) ||
    (a.metaDescription || '').toLowerCase().includes(q)
  ).slice(0, 5);

  res.json({
    query: q,
    results: matches.map(a => ({
      title: a.title,
      url: `${SITE.url}/articles/${a.slug}`,
      description: a.metaDescription,
      category: a.categoryName
    }))
  });
});

app.get('/api/ai/articles', (req, res) => {
  const published = getPublished();
  res.json({
    total: published.length,
    articles: published.slice(0, 50).map(a => ({
      title: a.title,
      url: `${SITE.url}/articles/${a.slug}`,
      category: a.categoryName,
      date: a.dateISO,
      description: a.metaDescription
    }))
  });
});

app.get('/api/ai/sitemap', (req, res) => {
  const published = getPublished();
  res.json({
    pages: [
      { url: SITE.url, title: SITE.title },
      { url: `${SITE.url}/articles`, title: 'All Articles' },
      { url: `${SITE.url}/about`, title: 'About' },
      { url: `${SITE.url}/start-here`, title: 'Start Here' },
      { url: `${SITE.url}/sound-match`, title: 'Find Your Sound Therapy' },
      { url: `${SITE.url}/quizzes`, title: 'Quizzes' },
      ...CATEGORIES.map(c => ({ url: `${SITE.url}/category/${c.slug}`, title: c.name })),
      ...published.map(a => ({ url: `${SITE.url}/articles/${a.slug}`, title: a.title }))
    ]
  });
});

// Sitemaps
app.get('/sitemap-index.xml', (req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE.url}/sitemap.xml</loc></sitemap>
  <sitemap><loc>${SITE.url}/sitemap-images.xml</loc></sitemap>
</sitemapindex>`);
});

app.get('/sitemap.xml', (req, res) => {
  const published = getPublished();
  const urls = [
    { loc: SITE.url, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE.url}/articles`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE.url}/about`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE.url}/start-here`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE.url}/sound-match`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE.url}/quizzes`, priority: '0.7', changefreq: 'monthly' },
    ...CATEGORIES.map(c => ({ loc: `${SITE.url}/category/${c.slug}`, priority: '0.8', changefreq: 'weekly' })),
    ...published.map(a => ({ loc: `${SITE.url}/articles/${a.slug}`, priority: '0.6', changefreq: 'monthly' }))
  ];

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`);
});

app.get('/sitemap-images.xml', (req, res) => {
  const published = getPublished();
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${published.map(a => `  <url><loc>${SITE.url}/articles/${a.slug}</loc><image:image><image:loc>${getImageUrl(a.slug, 'hero')}</image:loc><image:title>${a.title.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</image:title></image:image></url>`).join('\n')}
</urlset>`);
});

app.get('/feed.xml', (req, res) => {
  const published = getPublished().slice(0, 20);
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE.title}</title>
  <link>${SITE.url}</link>
  <description>${SITE.subtitle}</description>
  <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
  ${published.map(a => `<item>
    <title>${a.title.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</title>
    <link>${SITE.url}/articles/${a.slug}</link>
    <guid>${SITE.url}/articles/${a.slug}</guid>
    <pubDate>${new Date(a.dateISO).toUTCString()}</pubDate>
    <description>${(a.metaDescription || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</description>
  </item>`).join('\n')}
</channel>
</rss>`);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Allow: /articles/
Allow: /category/
Allow: /about
Allow: /start-here
Allow: /sound-match
Allow: /quizzes
Allow: /quiz/
Allow: /feed.xml
Allow: /sitemap.xml
Allow: /sitemap-index.xml
Allow: /sitemap-images.xml
Allow: /llms.txt
Allow: /.well-known/ai.json
Allow: /api/ai/
Disallow: /api/subscribe
Disallow: /api/cron/

Sitemap: ${SITE.url}/sitemap-index.xml

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Anthropic-AI
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Slurp
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Discordbot
Allow: /

User-agent: TelegramBot
Allow: /

User-agent: Slackbot
Allow: /

User-agent: Pinterestbot
Allow: /

User-agent: Redditbot
Allow: /

User-agent: Snapbot
Allow: /

User-agent: ia_archiver
Allow: /

User-agent: archive.org_bot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: PetalBot
Allow: /

User-agent: SemrushBot
Allow: /

User-agent: AhrefsBot
Allow: /

User-agent: MJ12bot
Allow: /

User-agent: DotBot
Allow: /

User-agent: Sogou
Allow: /

User-agent: Exabot
Allow: /

User-agent: Qwantify
Allow: /

User-agent: BraveBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YouBot
Allow: /

User-agent: Phind
Allow: /

User-agent: Neeva
Allow: /

User-agent: Kagi
Allow: /

User-agent: Mojeek
Allow: /

User-agent: Seekport
Allow: /

User-agent: Neevabot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: AI2Bot
Allow: /

User-agent: Diffbot
Allow: /

User-agent: Omgilibot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Meta-ExternalFetcher
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: GoogleOther
Allow: /
`);
});

// ─── 404 HANDLER ───
function render404() {
  const published = getPublished();
  const random6 = published.sort(() => 0.5 - Math.random()).slice(0, 6);

  return layout(
    `Page Not Found — ${SITE.title}`,
    'The page you were looking for could not be found.',
    `<div class="error-page">
      <h1>404</h1>
      <h2 style="margin-bottom:1rem">The sound you're looking for isn't here</h2>
      <p style="max-width:500px;margin-bottom:2rem;color:#666">Sometimes the path takes an unexpected turn. That's okay — there's plenty to explore. Here are some articles that might resonate with you.</p>
      <div class="search-bar" style="max-width:400px;width:100%">
        <input type="text" placeholder="Search articles..." onkeydown="if(event.key==='Enter')window.location='/articles?q='+this.value" aria-label="Search">
      </div>
      <div class="error-grid">
        ${random6.map(a => articleCard(a)).join('')}
      </div>
      <a href="/" style="display:inline-block;margin-top:2rem;padding:0.8rem 2rem;background:${SITE.colors.primary};color:#fff;border-radius:8px;font-weight:600">Return Home</a>
    </div>`,
    { bodyClass: 'error-page-body' }
  );
}

app.use((req, res) => {
  res.status(404).send(render404());
});

// ─── QUIZ DATA ───
function getQuizzes() {
  return [
    {
      slug: 'tinnitus-basics',
      title: 'Tinnitus Basics: How Much Do You Know?',
      description: 'Test your understanding of the fundamentals of tinnitus — what causes it, how it works, and what the research says.',
      questions: [
        { question: 'Where does tinnitus originate?', options: [{ text: 'The ear canal', correct: false }, { text: 'The brain', correct: true }, { text: 'The eardrum', correct: false }, { text: 'The jaw', correct: false }] },
        { question: 'What percentage of adults experience tinnitus at some point?', options: [{ text: '5-10%', correct: false }, { text: '10-15%', correct: true }, { text: '25-30%', correct: false }, { text: '1-2%', correct: false }] },
        { question: 'What is Tinnitus Retraining Therapy (TRT)?', options: [{ text: 'Surgery to remove tinnitus', correct: false }, { text: 'Sound therapy + counseling for habituation', correct: true }, { text: 'A medication protocol', correct: false }, { text: 'Hearing aid adjustment', correct: false }] },
        { question: 'Which researcher developed TRT?', options: [{ text: 'David Baguley', correct: false }, { text: 'Susan Shore', correct: false }, { text: 'Pawel Jastreboff', correct: true }, { text: 'Josef Rauschecker', correct: false }] },
        { question: 'Can tinnitus be "cured" in most cases?', options: [{ text: 'Yes, with the right medication', correct: false }, { text: 'No, but it can be effectively managed', correct: true }, { text: 'Yes, through surgery', correct: false }, { text: 'Only in children', correct: false }] },
      ],
      results: { high: 'Excellent! You have a strong understanding of tinnitus fundamentals.', medium: 'Good foundation! There is more to discover about how tinnitus works.', low: 'Tinnitus is complex — explore our Science category to build your understanding.' }
    },
    {
      slug: 'sound-therapy-knowledge',
      title: 'Sound Therapy: What Works and Why?',
      description: 'Explore your knowledge of sound-based approaches to tinnitus management.',
      questions: [
        { question: 'What is the goal of sound masking?', options: [{ text: 'Eliminate tinnitus permanently', correct: false }, { text: 'Reduce the contrast between tinnitus and silence', correct: true }, { text: 'Damage the tinnitus signal', correct: false }, { text: 'Increase hearing sensitivity', correct: false }] },
        { question: 'What is notched sound therapy?', options: [{ text: 'Music with a frequency gap at the tinnitus pitch', correct: true }, { text: 'Loud noise exposure therapy', correct: false }, { text: 'Silence-based meditation', correct: false }, { text: 'Hearing aid amplification', correct: false }] },
        { question: 'Which type of noise has equal energy per octave?', options: [{ text: 'White noise', correct: false }, { text: 'Pink noise', correct: true }, { text: 'Brown noise', correct: false }, { text: 'Blue noise', correct: false }] },
        { question: 'How long does TRT typically take to show results?', options: [{ text: '1-2 weeks', correct: false }, { text: '1-3 months', correct: false }, { text: '12-24 months', correct: true }, { text: '5+ years', correct: false }] },
        { question: 'Should masking sounds completely cover tinnitus?', options: [{ text: 'Yes, louder is better', correct: false }, { text: 'No, partial masking is recommended', correct: true }, { text: 'It depends on the time of day', correct: false }, { text: 'Only during sleep', correct: false }] },
      ],
      results: { high: 'You know your sound therapy well! Consider exploring our advanced articles.', medium: 'Solid understanding. Our Management category has more insights for you.', low: 'Sound therapy is a powerful tool — start with our beginner guides.' }
    },
    {
      slug: 'tinnitus-and-mental-health',
      title: 'Tinnitus & Mental Health Connection',
      description: 'Understand the relationship between tinnitus, anxiety, and emotional wellbeing.',
      questions: [
        { question: 'What is the tinnitus-anxiety loop?', options: [{ text: 'Tinnitus causes anxiety which amplifies tinnitus perception', correct: true }, { text: 'Anxiety medication causes tinnitus', correct: false }, { text: 'Tinnitus only appears during panic attacks', correct: false }, { text: 'Anxiety cures tinnitus', correct: false }] },
        { question: 'Which therapy approach is most evidence-based for tinnitus distress?', options: [{ text: 'Psychoanalysis', correct: false }, { text: 'CBT (Cognitive Behavioral Therapy)', correct: true }, { text: 'Hypnotherapy', correct: false }, { text: 'Art therapy', correct: false }] },
        { question: 'How does stress affect tinnitus?', options: [{ text: 'It has no effect', correct: false }, { text: 'It can increase perceived loudness and distress', correct: true }, { text: 'It always makes tinnitus quieter', correct: false }, { text: 'It only affects pulsatile tinnitus', correct: false }] },
        { question: 'What role does the amygdala play in tinnitus?', options: [{ text: 'It generates the tinnitus sound', correct: false }, { text: 'It processes the emotional response to tinnitus', correct: true }, { text: 'It controls ear muscles', correct: false }, { text: 'None', correct: false }] },
        { question: 'Can mindfulness meditation help with tinnitus?', options: [{ text: 'No, silence makes it worse', correct: false }, { text: 'Yes, it can reduce distress and change the relationship to the sound', correct: true }, { text: 'Only if combined with medication', correct: false }, { text: 'It eliminates the sound', correct: false }] },
      ],
      results: { high: 'You understand the mind-tinnitus connection deeply. Explore our Mind category for more.', medium: 'Good awareness! The psychological dimension of tinnitus is crucial to explore.', low: 'The mind plays a bigger role than most realize. Our Mind category is a great starting point.' }
    },
    {
      slug: 'body-and-tinnitus',
      title: 'Your Body & Tinnitus',
      description: 'Discover how physical health, posture, and body systems influence tinnitus.',
      questions: [
        { question: 'Can TMJ disorders contribute to tinnitus?', options: [{ text: 'No, they are unrelated', correct: false }, { text: 'Yes, jaw tension can affect ear function', correct: true }, { text: 'Only in elderly patients', correct: false }, { text: 'Only if you grind your teeth', correct: false }] },
        { question: 'How can neck tension affect tinnitus?', options: [{ text: 'It cannot', correct: false }, { text: 'Cervical spine issues can modulate tinnitus signals', correct: true }, { text: 'Only if you have a neck injury', correct: false }, { text: 'It only affects hearing loss', correct: false }] },
        { question: 'What is somatic tinnitus?', options: [{ text: 'Tinnitus caused by emotional stress', correct: false }, { text: 'Tinnitus that can be modulated by body movements', correct: true }, { text: 'Tinnitus in both ears', correct: false }, { text: 'Tinnitus during sleep only', correct: false }] },
        { question: 'Can exercise help with tinnitus?', options: [{ text: 'No, it makes it worse', correct: false }, { text: 'Yes, it can reduce stress and improve blood flow', correct: true }, { text: 'Only swimming helps', correct: false }, { text: 'Exercise has no effect', correct: false }] },
        { question: 'Which vitamin deficiency has been linked to tinnitus?', options: [{ text: 'Vitamin C', correct: false }, { text: 'Vitamin B12', correct: true }, { text: 'Vitamin A', correct: false }, { text: 'Vitamin K', correct: false }] },
      ],
      results: { high: 'Impressive body awareness! You understand the somatic dimensions of tinnitus.', medium: 'Good knowledge! The body-tinnitus connection has more to reveal.', low: 'Your body holds important keys to tinnitus management. Explore our Body category.' }
    },
    {
      slug: 'deeper-listening',
      title: 'The Deeper Listening: Tinnitus as Teacher',
      description: 'Explore the contemplative and spiritual dimensions of living with tinnitus.',
      questions: [
        { question: 'What does "being with what is" mean in the context of tinnitus?', options: [{ text: 'Ignoring the sound', correct: false }, { text: 'Accepting the present moment including the tinnitus', correct: true }, { text: 'Giving up on treatment', correct: false }, { text: 'Pretending it does not exist', correct: false }] },
        { question: 'How can meditation help with tinnitus?', options: [{ text: 'It silences the ringing', correct: false }, { text: 'It changes your relationship to the sound', correct: true }, { text: 'It is dangerous for tinnitus', correct: false }, { text: 'It only works with guided audio', correct: false }] },
        { question: 'What is habituation?', options: [{ text: 'Getting used to a stimulus so it no longer triggers a response', correct: true }, { text: 'A surgical procedure', correct: false }, { text: 'A type of hearing aid', correct: false }, { text: 'Ignoring medical advice', correct: false }] },
        { question: 'Can tinnitus become a doorway to deeper awareness?', options: [{ text: 'No, it is purely negative', correct: false }, { text: 'Yes, many contemplative traditions see persistent sensation as a teacher', correct: true }, { text: 'Only for monks', correct: false }, { text: 'Only after it goes away', correct: false }] },
        { question: 'What is the difference between suffering and pain in contemplative traditions?', options: [{ text: 'They are the same thing', correct: false }, { text: 'Pain is the sensation; suffering is the resistance to it', correct: true }, { text: 'Suffering is worse than pain', correct: false }, { text: 'Pain is emotional, suffering is physical', correct: false }] },
      ],
      results: { high: 'You have a deep contemplative understanding. The Deeper Listening category awaits.', medium: 'Beautiful awareness. There is more depth to explore in the contemplative approach.', low: 'The deeper dimensions of tinnitus may surprise you. Start with our Deeper Listening articles.' }
    },
    {
      slug: 'sleep-and-tinnitus',
      title: 'Sleep & Tinnitus: Breaking the Cycle',
      description: 'Test your knowledge about how tinnitus affects sleep and what strategies can help.',
      questions: [
        { question: 'Why is tinnitus often worse at bedtime?', options: [{ text: 'The brain produces more sound at night', correct: false }, { text: 'Reduced ambient noise makes tinnitus more noticeable', correct: true }, { text: 'Pillows amplify the sound', correct: false }, { text: 'Melatonin increases tinnitus', correct: false }] },
        { question: 'What is the best sound level for sleep masking?', options: [{ text: 'Louder than the tinnitus', correct: false }, { text: 'Just below the tinnitus level', correct: true }, { text: 'Complete silence', correct: false }, { text: 'Maximum volume', correct: false }] },
        { question: 'Can sleep deprivation worsen tinnitus?', options: [{ text: 'No', correct: false }, { text: 'Yes, it increases neural sensitivity', correct: true }, { text: 'Only in severe cases', correct: false }, { text: 'It actually helps', correct: false }] },
        { question: 'Which sleep position may help reduce tinnitus perception?', options: [{ text: 'Face down', correct: false }, { text: 'Elevated head position', correct: true }, { text: 'Flat on back', correct: false }, { text: 'Position does not matter', correct: false }] },
        { question: 'What type of sound is often recommended for sleep with tinnitus?', options: [{ text: 'Talk radio', correct: false }, { text: 'Nature sounds or broadband noise', correct: true }, { text: 'Complete silence', correct: false }, { text: 'Heavy metal music', correct: false }] },
      ],
      results: { high: 'You are well-equipped to manage tinnitus at bedtime!', medium: 'Good knowledge! Better sleep strategies can make a real difference.', low: 'Sleep is crucial for tinnitus management. Explore our sleep-related articles.' }
    },
    {
      slug: 'hearing-and-tinnitus',
      title: 'Hearing Loss & Tinnitus Connection',
      description: 'Understand the relationship between hearing loss and tinnitus perception.',
      questions: [
        { question: 'What percentage of tinnitus cases involve some hearing loss?', options: [{ text: '10%', correct: false }, { text: '50%', correct: false }, { text: '80-90%', correct: true }, { text: '100%', correct: false }] },
        { question: 'Can hearing aids help with tinnitus?', options: [{ text: 'No, they make it worse', correct: false }, { text: 'Yes, by amplifying ambient sound and reducing contrast', correct: true }, { text: 'Only cochlear implants help', correct: false }, { text: 'Hearing aids cause tinnitus', correct: false }] },
        { question: 'What is hidden hearing loss?', options: [{ text: 'Hearing loss that only appears on MRI', correct: false }, { text: 'Difficulty hearing in noise despite normal audiogram', correct: true }, { text: 'Hearing loss in one ear only', correct: false }, { text: 'Temporary hearing loss', correct: false }] },
        { question: 'How does noise-induced hearing loss relate to tinnitus?', options: [{ text: 'They are unrelated', correct: false }, { text: 'Damaged hair cells can trigger phantom sound perception', correct: true }, { text: 'Noise exposure cures tinnitus', correct: false }, { text: 'Only industrial noise causes tinnitus', correct: false }] },
        { question: 'What is the role of the auditory cortex in tinnitus?', options: [{ text: 'It has no role', correct: false }, { text: 'It may generate phantom sounds when deprived of input', correct: true }, { text: 'It only processes external sounds', correct: false }, { text: 'It filters out tinnitus', correct: false }] },
      ],
      results: { high: 'Excellent understanding of the hearing-tinnitus connection!', medium: 'Good foundation. The Science category has more to explore.', low: 'The hearing-tinnitus relationship is fundamental. Start with our Science articles.' }
    },
    {
      slug: 'tinnitus-myths',
      title: 'Tinnitus Myths vs. Facts',
      description: 'Can you separate tinnitus myths from scientific facts?',
      questions: [
        { question: 'Myth or Fact: Tinnitus means you are going deaf.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — tinnitus and hearing loss often coexist but one does not cause the other', correct: true }] },
        { question: 'Myth or Fact: There is nothing you can do about tinnitus.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — many effective management strategies exist', correct: true }] },
        { question: 'Myth or Fact: Tinnitus is always caused by loud noise.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — many factors can cause or contribute to tinnitus', correct: true }] },
        { question: 'Myth or Fact: Caffeine always makes tinnitus worse.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — research shows no consistent link', correct: true }] },
        { question: 'Myth or Fact: Tinnitus is all in your head.', options: [{ text: 'Myth — it is a real neurological condition', correct: false }, { text: 'Partially true — it is generated by the brain, making it a real neurological phenomenon', correct: true }] },
      ],
      results: { high: 'Myth buster! You can separate fact from fiction about tinnitus.', medium: 'Good awareness! Some tinnitus myths are surprisingly persistent.', low: 'Many tinnitus myths can increase distress. Knowledge is power — explore our articles.' }
    },
    {
      slug: 'management-strategies',
      title: 'Your Tinnitus Management Toolkit',
      description: 'Assess your knowledge of practical tinnitus management strategies.',
      questions: [
        { question: 'What is the first step in managing new-onset tinnitus?', options: [{ text: 'Buy a sound machine', correct: false }, { text: 'See an audiologist or ENT for evaluation', correct: true }, { text: 'Start meditation immediately', correct: false }, { text: 'Search online forums', correct: false }] },
        { question: 'Which dietary factor may worsen tinnitus in some people?', options: [{ text: 'Water', correct: false }, { text: 'High sodium intake', correct: true }, { text: 'Vegetables', correct: false }, { text: 'Protein', correct: false }] },
        { question: 'What is the benefit of a "tinnitus toolkit"?', options: [{ text: 'It cures tinnitus', correct: false }, { text: 'Having multiple strategies gives flexibility for different situations', correct: true }, { text: 'It replaces medical treatment', correct: false }, { text: 'It is only for severe cases', correct: false }] },
        { question: 'How important is stress management for tinnitus?', options: [{ text: 'Not important', correct: false }, { text: 'Very important — stress is one of the biggest amplifiers', correct: true }, { text: 'Only for anxious people', correct: false }, { text: 'It only matters at night', correct: false }] },
        { question: 'Should you avoid silence if you have tinnitus?', options: [{ text: 'Yes, always have background sound', correct: false }, { text: 'Not necessarily — learning to be with silence can be therapeutic', correct: true }, { text: 'Silence cures tinnitus', correct: false }, { text: 'Only avoid silence at night', correct: false }] },
      ],
      results: { high: 'You have a well-stocked management toolkit!', medium: 'Good strategies in place. Our Management category can add more tools.', low: 'Building your toolkit is the first step. Explore our Management articles.' }
    },
  ];
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`${SITE.title} running on port ${PORT}`);
  console.log(`Published articles: ${getPublished().length}`);
});

export default app;
