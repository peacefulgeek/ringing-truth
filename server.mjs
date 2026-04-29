import express from 'express';
import compression from 'compression';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── WWW → NON-WWW 301 REDIRECT ───
app.use((req, res, next) => {
  const host = req.hostname || req.headers.host;
  if (host && host.startsWith('www.')) {
    const newHost = host.replace(/^www\./, '');
    return res.redirect(301, `https://${newHost}${req.originalUrl}`);
  }
  next();
});

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
app.use('/assets', express.static(join(__dirname, 'dist/assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));
app.use(express.json());

// ─── SITE CONFIG ───
const SITE = {
  title: 'The Ringing Truth',
  subtitle: 'Living with Tinnitus Without Losing Your Mind',
  tagline: 'The ringing won\'t stop. But the suffering can.',
  domain: 'ringingtruth.com',
  url: 'https://ringingtruth.com',
  author: 'The Ringing Truth Editorial',
  authorPerson: 'Kalesh',
  authorTitle: 'Consciousness Teacher & Writer',
  authorBio: 'Kalesh is a mystic and spiritual advisor who brings ancient wisdom and depth to life\'s biggest decisions.',
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
  return arts.filter(a => a.status !== 'queued' && a.dateISO && new Date(a.dateISO) <= now);
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

    :root {
      --bg-primary: #FAFAF5;
      --text-primary: #1E2228;
      --body-font-size-desktop: 18px;
      --body-font-size-mobile: 16px;
      --line-height-body: 1.75;
      --max-content-width: 720px;
      --tap-target-min: 44px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif; font-size: var(--body-font-size-desktop); line-height: var(--line-height-body); color: var(--text-primary); background: var(--bg-primary); }
    @media (max-width: 768px) { body { font-size: var(--body-font-size-mobile); } }
    h1, h2, h3, h4 { font-family: 'Literata', Georgia, serif; line-height: 1.3; color: var(--text-primary); }
    a { color: ${SITE.colors.primary}; text-decoration: none; transition: color 0.2s; }
    a:hover { color: ${SITE.colors.accent}; }
    img { max-width: 100%; height: auto; display: block; }
    article p, article li { max-width: 72ch; }
    button, a.button, .cta { min-height: var(--tap-target-min); min-width: var(--tap-target-min); }

    /* Navigation */
    .site-nav { background: #fff; border-bottom: 1px solid #e8e8e0; position: sticky; top: 0; z-index: 100; }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem; text-align: center; }
    .site-name { font-family: 'Literata', serif; font-size: 1.5rem; font-weight: 700; color: #1a1a2e; display: block; margin-bottom: 0.5rem; }
    .site-name a { color: inherit; }
    .nav-links { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .nav-link { padding: 0.3rem 0.8rem; font-size: 0.85rem; font-weight: 500; color: #555; }
    .nav-link:hover { color: ${SITE.colors.primary}; }
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
    .article-body { font-family: 'Literata', Georgia, serif; font-size: 1.05rem; line-height: 1.85; }
    .article-body h2 { margin: 2rem 0 1rem; font-size: 1.4rem; }
    .article-body p { margin-bottom: 1.2rem; }
    .article-body blockquote { margin: 1.5rem 0; padding: 1rem 1.5rem; border-left: 4px solid ${SITE.colors.primary}; background: #f8f8f5; font-style: italic; border-radius: 0 8px 8px 0; }
    .article-body a { color: ${SITE.colors.primary}; text-decoration: underline; text-decoration-color: ${SITE.colors.secondary}; text-underline-offset: 3px; }

    /* Affiliate Disclosure */
    .affiliate-disclosure { background: #fef9f0; border: 1px solid #f0e0c0; border-radius: 8px; padding: 0.8rem 1.2rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #8a6d3b; }

    /* Health Disclaimer */
    .health-disclaimer { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid #dee2e6; border-radius: 12px; padding: 1.5rem; margin-top: 2.5rem; }
    .health-disclaimer h4 { font-size: 0.95rem; color: #495057; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .health-disclaimer p { font-size: 0.88rem; color: #6c757d; line-height: 1.6; margin: 0; }

    /* Bio Card */
    .bio-card { display: flex; gap: 1.5rem; padding: 1.5rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-top: 2rem; align-items: flex-start; }
    .bio-card img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .bio-name { font-family: 'Literata', serif; font-size: 1.1rem; font-weight: 700; }
    .bio-title { color: ${SITE.colors.primary}; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .bio-text { font-size: 0.9rem; color: #666; margin-bottom: 0.8rem; }
    .bio-link { display: inline-block; padding: 0.5rem 1.2rem; background: ${SITE.colors.primary}; color: #fff; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
    .bio-link:hover { background: #006666; color: #fff; }
    .bio-session { display: inline-block; padding: 0.5rem 1.2rem; background: ${SITE.colors.accent}; color: #fff; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem; }
    .bio-session:hover { background: #d4785e; color: #fff; }

    /* Sidebar */
    .article-sidebar { position: sticky; top: 80px; }
    .sidebar-section { margin-bottom: 2rem; }
    .sidebar-section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid ${SITE.colors.primary}; }
    .sidebar-article { display: flex; gap: 0.8rem; margin-bottom: 0.8rem; align-items: center; }
    .sidebar-article img { width: 80px; height: 60px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
    .sidebar-article-title { font-size: 0.85rem; line-height: 1.3; }
    .sidebar-bio { background: #fff; border-radius: 12px; padding: 1.2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-align: center; margin-bottom: 2rem; }
    .sidebar-bio img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 0.8rem; }
    .sidebar-bio h4 { font-size: 1rem; margin-bottom: 0.2rem; }
    .sidebar-bio .bio-subtitle { font-size: 0.8rem; color: ${SITE.colors.primary}; margin-bottom: 0.5rem; }
    .sidebar-bio p { font-size: 0.82rem; color: #666; margin-bottom: 0.8rem; line-height: 1.5; }
    .sidebar-bio .bio-btn { display: inline-block; padding: 0.4rem 1rem; background: ${SITE.colors.primary}; color: #fff; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .sidebar-bio .bio-btn:hover { background: #006666; color: #fff; }
    .sidebar-tools { background: #f8f8f5; border-radius: 12px; padding: 1.2rem; margin-bottom: 2rem; }
    .sidebar-tools h4 { font-size: 0.95rem; margin-bottom: 0.5rem; }
    .sidebar-tools a { display: block; font-size: 0.85rem; padding: 0.3rem 0; }

    /* Share */
    .share-buttons { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .share-btn { padding: 0.4rem 1rem; background: #f5f5f0; border: 1px solid #e0e0d8; border-radius: 2rem; font-size: 0.8rem; cursor: pointer; color: #555; }
    .share-btn:hover { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* FAQ */
    .faq-section { margin-top: 2.5rem; }
    .faq-item { border: 1px solid #e8e8e0; border-radius: 8px; margin-bottom: 0.8rem; overflow: hidden; }
    .faq-q { padding: 1rem 1.2rem; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fafaf8; }
    .faq-q:hover { background: #f0f0ea; }
    .faq-arrow { font-size: 0.8rem; transition: transform 0.2s; }
    .faq-a { padding: 0 1.2rem; max-height: 0; overflow: hidden; transition: max-height 0.3s, padding 0.3s; }
    .faq-a.open { max-height: 500px; padding: 1rem 1.2rem; }

    /* Cross Links */
    .cross-links { margin-top: 2.5rem; }
    .cross-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }

    /* Search & Filter */
    .search-bar { margin-bottom: 1.5rem; }
    .search-bar input { width: 100%; padding: 0.8rem 1rem; border: 2px solid #e8e8e0; border-radius: 8px; font-size: 1rem; background: #fff; }
    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-btn { padding: 0.4rem 1rem; border-radius: 2rem; border: 1px solid #e0e0d8; background: #fff; font-size: 0.85rem; cursor: pointer; }
    .filter-btn:hover, .filter-btn.active { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* Page Content */
    .page-content { max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; }
    .page-content h1 { margin-bottom: 1.5rem; }
    .page-content h2 { margin: 2rem 0 1rem; }
    .page-content p { margin-bottom: 1rem; }

    /* Advisor Card */
    .advisor-card { display: flex; gap: 2rem; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin: 1.5rem 0; align-items: flex-start; }
    .advisor-card img { width: 150px; height: 150px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }

    /* Tools Page */
    .tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
    .tool-card { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0ea; }
    .tool-card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    .tool-card h3 a { color: ${SITE.colors.primary}; text-decoration: underline; text-underline-offset: 3px; }
    .tool-card p { font-size: 0.92rem; color: #555; line-height: 1.6; }

    /* Quiz */
    .quiz-container { max-width: 700px; margin: 0 auto; padding: 2rem 0; }
    .quiz-progress { height: 6px; background: #e8e8e0; border-radius: 3px; margin-bottom: 2rem; }
    .quiz-progress-bar { height: 100%; background: ${SITE.colors.primary}; border-radius: 3px; transition: width 0.3s; }
    .quiz-question { font-family: 'Literata', serif; font-size: 1.2rem; margin-bottom: 1.5rem; }
    .quiz-options { display: grid; gap: 0.8rem; }
    .quiz-option { padding: 1rem; background: #fff; border: 2px solid #e8e8e0; border-radius: 8px; cursor: pointer; text-align: left; font-size: 1rem; transition: all 0.2s; }
    .quiz-option:hover { border-color: ${SITE.colors.primary}; background: #f0fafa; }
    .quiz-result { text-align: center; padding: 2rem 0; }
    .quiz-share { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; }

    /* Sound Match */
    .sm-step { margin-bottom: 1.5rem; }
    .sm-label { font-weight: 600; margin-bottom: 0.8rem; }
    .sm-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .sm-option { padding: 0.6rem 1.2rem; border: 2px solid #e8e8e0; border-radius: 2rem; background: #fff; cursor: pointer; transition: all 0.2s; }
    .sm-option:hover { border-color: ${SITE.colors.primary}; }
    .sm-option.selected { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* Assessment */
    .assessment-question { margin-bottom: 1.5rem; }
    .assessment-question label { display: block; font-weight: 500; margin-bottom: 0.5rem; }
    .assessment-scale { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .assessment-scale button { width: 44px; height: 44px; border: 2px solid #e8e8e0; border-radius: 8px; background: #fff; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .assessment-scale button:hover { border-color: ${SITE.colors.primary}; }
    .assessment-scale button.selected { background: ${SITE.colors.primary}; color: #fff; border-color: ${SITE.colors.primary}; }

    /* Error Page */
    .error-page { text-align: center; padding: 4rem 1.5rem; }
    .error-page h1 { font-size: 5rem; color: ${SITE.colors.primary}; }
    .error-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 900px; margin: 2rem auto; }

    /* Footer */
    .site-footer { background: #1a1a2e; color: #aaa; padding: 3rem 1.5rem 1.5rem; margin-top: 3rem; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .footer-col h4 { color: #fff; margin-bottom: 1rem; font-size: 0.95rem; }
    .footer-col a { display: block; color: #aaa; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .footer-col a:hover { color: #fff; }
    .footer-bottom { max-width: 1200px; margin: 2rem auto 0; padding-top: 1.5rem; border-top: 1px solid #333; text-align: center; font-size: 0.8rem; color: #666; }
    .footer-amazon { font-size: 0.78rem; color: #888; margin-top: 0.5rem; }

    /* Responsive */
    @media (max-width: 900px) {
      .masonry { grid-template-columns: repeat(2, 1fr); }
      .article-layout { grid-template-columns: 1fr; }
      .article-sidebar { position: static; }
      .footer-inner { grid-template-columns: 1fr; }
      .error-grid { grid-template-columns: repeat(2, 1fr); }
      .cross-grid { grid-template-columns: 1fr; }
      .advisor-card { flex-direction: column; align-items: center; text-align: center; }
      .bio-card { flex-direction: column; align-items: center; text-align: center; }
      .tools-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .masonry { grid-template-columns: 1fr; }
      .error-grid { grid-template-columns: 1fr; }
      .newsletter-form { flex-direction: column; }
    }
  </style>
  ${jsonLd}
</head>
<body class="${bodyClass}">
  <nav class="site-nav">
    <div class="nav-inner">
      <span class="site-name"><a href="/">${SITE.title}</a></span>
      <div class="nav-links">
        <a href="/articles" class="nav-link">Articles</a>
        <a href="/start-here" class="nav-link">Start Here</a>
        <a href="/tools" class="nav-link">Tools We Recommend</a>
        <a href="/quizzes" class="nav-link">Quizzes</a>
        <a href="/assessments" class="nav-link">Assessments</a>
        <a href="/sound-match" class="nav-link">Sound Match</a>
        <a href="/about" class="nav-link">About</a>
      </div>
      <div class="cat-tabs">
        ${CATEGORIES.map(c => `<a href="/category/${c.slug}" class="cat-tab">${c.name}</a>`).join('')}
      </div>
    </div>
  </nav>

  ${content}

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col">
        <h4>${SITE.title}</h4>
        <a href="/start-here">Start Here</a>
        <a href="/articles">All Articles</a>
        <a href="/tools">Tools We Recommend</a>
        <a href="/quizzes">Quizzes</a>
        <a href="/assessments">Assessments</a>
        <a href="/sound-match">Find Your Sound Therapy</a>
      </div>
      <div class="footer-col">
        <h4>Categories</h4>
        ${CATEGORIES.map(c => `<a href="/category/${c.slug}">${c.name}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>More</h4>
        <a href="/about">About</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/feed.xml">RSS Feed</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${SITE.title}. All rights reserved.</p>
      <p class="footer-amazon">As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </footer>

  <script>
  // Newsletter form handler
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
      const success = form.parentElement.querySelector('.newsletter-success');
      if (success) success.style.display = 'block';
    });
  });

  // FAQ toggle
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const a = q.nextElementSibling;
      const arrow = q.querySelector('.faq-arrow');
      a.classList.toggle('open');
      if (arrow) arrow.style.transform = a.classList.contains('open') ? 'rotate(180deg)' : '';
    });
  });
  </script>
</body>
</html>`;
}

function articleCard(a) {
  const heroUrl = getImageUrl(a.slug, 'hero');
  return `<a href="/articles/${a.slug}" class="card">
    <div class="card-img">
      <img src="${heroUrl}" alt="${a.title}" width="400" height="300" loading="lazy">
      <div class="card-gradient">
        <div class="card-title">${a.title}</div>
        <span class="cat-pill">${a.categoryName}</span>
      </div>
    </div>
  </a>`;
}

// ─── HOMEPAGE ───
app.get('/', (req, res) => {
  const published = getPublished();
  const latest = published.slice(0, 12);

  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    url: SITE.url,
    description: SITE.subtitle,
    author: { "@type": "Person", name: "Kalesh", url: SITE.authorLink },
    potentialAction: { "@type": "SearchAction", target: `${SITE.url}/articles?q={search_term_string}`, "query-input": "required name=search_term_string" }
  })}</script>`;

  const content = `
    <div class="hero">
      <div class="hero-bg" style="background-image:url('${SITE.cdnBase}/images/og-default.png')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>${SITE.title}</h1>
        <p>${SITE.subtitle}</p>
        <p class="tagline">${SITE.tagline}</p>
      </div>
    </div>

    <div class="container">
      <h2 class="section-title">Latest Articles</h2>
      <div class="masonry">
        ${latest.map(a => articleCard(a)).join('')}
      </div>

      <div style="text-align:center;margin:2rem 0">
        <a href="/articles" style="display:inline-block;padding:0.8rem 2rem;background:${SITE.colors.primary};color:#fff;border-radius:8px;font-weight:600">Browse All ${published.length} Articles</a>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:2rem 0">
        <a href="/tools" class="card" style="padding:1.5rem;text-align:center">
          <h3 style="font-size:1rem;margin-bottom:0.3rem">Tools We Recommend</h3>
          <p style="font-size:0.85rem;color:#666">Curated products for tinnitus relief</p>
        </a>
        <a href="/quizzes" class="card" style="padding:1.5rem;text-align:center">
          <h3 style="font-size:1rem;margin-bottom:0.3rem">Quizzes</h3>
          <p style="font-size:0.85rem;color:#666">Test your tinnitus knowledge</p>
        </a>
        <a href="/assessments" class="card" style="padding:1.5rem;text-align:center">
          <h3 style="font-size:1rem;margin-bottom:0.3rem">Assessments</h3>
          <p style="font-size:0.85rem;color:#666">Evaluate your tinnitus experience</p>
        </a>
        <a href="/sound-match" class="card" style="padding:1.5rem;text-align:center">
          <h3 style="font-size:1rem;margin-bottom:0.3rem">Sound Match</h3>
          <p style="font-size:0.85rem;color:#666">Find your sound therapy</p>
        </a>
      </div>

      <div class="newsletter">
        <h2>Stay Connected</h2>
        <p>Get new insights on living well with tinnitus, delivered to your inbox.</p>
        <form class="newsletter-form" data-source="homepage">
          <input type="email" placeholder="Your email address" required aria-label="Email address">
          <button type="submit">Join</button>
        </form>
        <p class="newsletter-success">Thanks for subscribing!</p>
      </div>
    </div>`;

  res.send(layout(
    `${SITE.title} — ${SITE.subtitle}`,
    SITE.tagline,
    content,
    { canonical: SITE.url, jsonLd }
  ));
});


// ─── ARTICLES LISTING ───
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
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') window.location.href = '/articles?q=' + encodeURIComponent(e.target.value);
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

// ─── CATEGORY PAGES ───
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

// ─── ARTICLE PAGE ───
app.get('/articles/:slug', (req, res) => {
  const article = articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).send(render404());
  if (article.status === 'queued') return res.status(404).send(render404());
  if (!article.dateISO || new Date(article.dateISO) > new Date()) return res.status(404).send(render404());

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
        <div class="faq-q" tabindex="0" role="button" aria-expanded="false">${f.question}<span class="faq-arrow">&#9660;</span></div>
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
    author: { "@type": "Person", name: "Kalesh", url: SITE.authorLink },
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

  // Affiliate disclosure (only for product articles)
  const affiliateDisclosure = article.hasAffiliateLink
    ? `<div class="affiliate-disclosure">This article contains affiliate links. We may earn a small commission if you make a purchase — at no extra cost to you.</div>`
    : '';

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

        ${affiliateDisclosure}

        <div class="share-buttons">
          <button class="share-btn" aria-label="Copy link" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='Copied!'">Copy Link</button>
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE.url + '/articles/' + article.slug)}&text=${encodeURIComponent(article.title)}" class="share-btn" rel="nofollow noopener" target="_blank">Share on X</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE.url + '/articles/' + article.slug)}" class="share-btn" rel="nofollow noopener" target="_blank">Share on Facebook</a>
        </div>

        ${h2s.length > 0 ? `<div class="toc">${h2s.map(h => `<a href="#${h.id}">${h.text}</a>`).join('')}</div>` : ''}

        <div class="article-body">${bodyWithIds}</div>

        ${faqHtml}

        <div class="health-disclaimer">
          <h4>Health Information Disclaimer</h4>
          <p>The content on this page is provided for educational and informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Tinnitus can be a symptom of underlying medical conditions that require proper clinical evaluation by a qualified healthcare provider. Always consult your physician, audiologist, or other qualified health professional before making any changes to your treatment plan or health regimen. The experiences and perspectives shared here reflect personal and editorial viewpoints and should not be interpreted as clinical recommendations.</p>
        </div>

        <div class="cross-links">
          <h2>Keep Reading</h2>
          <div class="cross-grid">
            ${crossCat.slice(0, 4).map(a => articleCard(a)).join('')}
          </div>
        </div>

        <div class="bio-card">
          <img src="${SITE.cdnBase}/images/kalesh-photo.webp" alt="Kalesh" width="100" height="100">
          <div>
            <div class="bio-name">Kalesh</div>
            <div class="bio-title">${SITE.authorTitle}</div>
            <p class="bio-text">${SITE.authorBio}</p>
            <a href="${SITE.authorLink}" class="bio-link">Visit Kalesh's Website</a>
            <a href="${SITE.authorLink}" class="bio-session">Book a Session</a>
          </div>
        </div>
      </main>

      <aside class="article-sidebar">
        <div class="sidebar-bio">
          <img src="${SITE.cdnBase}/images/kalesh-photo.webp" alt="Kalesh" width="80" height="80">
          <h4>Kalesh</h4>
          <div class="bio-subtitle">${SITE.authorTitle}</div>
          <p>${SITE.authorBio}</p>
          <a href="${SITE.authorLink}" class="bio-btn">Visit Kalesh's Website</a>
        </div>
        <div class="sidebar-tools">
          <h4>Tools We Recommend</h4>
          <a href="/tools">Browse our curated tinnitus toolkit &rarr;</a>
        </div>
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


// ─── START HERE ───
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

// ─── ABOUT ───
app.get('/about', (req, res) => {
  const published = getPublished();
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Kalesh",
      jobTitle: SITE.authorTitle,
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
        <img src="${SITE.cdnBase}/images/kalesh-photo.webp" alt="Kalesh" width="150" height="150">
        <div>
          <h3 style="margin-bottom:0.3rem">Kalesh</h3>
          <p style="color:${SITE.colors.primary};margin-bottom:0.8rem">${SITE.authorTitle}</p>
          <p>${SITE.authorBio}</p>
          <div style="margin-top:1rem;display:flex;gap:0.8rem;flex-wrap:wrap">
            <a href="${SITE.authorLink}" style="display:inline-block;padding:0.5rem 1.2rem;background:${SITE.colors.primary};color:#fff;border-radius:6px;font-weight:600">Visit Kalesh's Website</a>
            <a href="${SITE.authorLink}" style="display:inline-block;padding:0.5rem 1.2rem;background:${SITE.colors.accent};color:#fff;border-radius:6px;font-weight:600">Book a Session</a>
          </div>
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

// ─── PRIVACY POLICY ───
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
      <h2>Affiliate Links</h2>
      <p>Some pages on this site contain affiliate links to products on Amazon.com. When you click these links and make a purchase, we may earn a small commission at no additional cost to you. These links are clearly identified with "(paid link)" labels. Amazon may collect data according to their own privacy policy when you visit their site through our links.</p>
      <h2>Your Rights</h2>
      <p>You have the right to request access to, correction of, or deletion of your personal data. Under GDPR and similar regulations, you may also object to processing or request data portability.</p>
    </div>`;

  res.send(layout(
    `Privacy Policy — ${SITE.title}`,
    `Privacy policy for ${SITE.title}. Learn how we handle your data.`,
    content,
    { canonical: `${SITE.url}/privacy` }
  ));
});

// ─── TERMS OF SERVICE ───
app.get('/terms', (req, res) => {
  const content = `
    <div class="page-content">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <h2>Educational Purpose</h2>
      <p>The content on ${SITE.title} is provided for educational and informational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician, audiologist, or other qualified health provider with any questions you may have regarding tinnitus or any medical condition.</p>
      <h2>No Professional Advice</h2>
      <p>Nothing on this website constitutes medical, therapeutic, or professional advice. The articles, quizzes, and tools are designed to inform and support — not to diagnose or treat any condition.</p>
      <h2>Affiliate Disclosure</h2>
      <p>As an Amazon Associate, ${SITE.title} earns from qualifying purchases. Some links on this site are affiliate links, meaning we may earn a commission if you click through and make a purchase. This does not affect the price you pay or our editorial independence. We only recommend products we believe may be genuinely helpful.</p>
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


// ─── TOOLS PAGE ───
app.get('/tools', (req, res) => {
  const TOOLS = [
    { category: 'Sound Therapy & Masking', items: [
      { asin: 'B07RWLJ5DB', name: 'LectroFan EVO White Noise Machine', desc: 'One of the most recommended sound machines for tinnitus management. Offers 22 unique non-looping sounds including white noise, fan sounds, and ocean surf. The adjustable volume and tone controls let you dial in exactly the right masking level.' },
      { asin: 'B00MY0YB5E', name: 'Marpac Dohm Classic White Noise Machine', desc: 'The original mechanical white noise machine, producing real fan-based sound rather than digital loops. Many tinnitus sufferers prefer its natural, consistent tone for sleep and daytime relief.' },
      { asin: 'B0C5KG6CFH', name: 'Portable Sound Therapy Speaker', desc: 'A compact Bluetooth speaker optimized for sound therapy frequencies. Take your masking sounds anywhere — office, travel, or bedside.' },
      { asin: 'B07L6MHFQ3', name: 'Pillow Speaker for Sleep', desc: 'Slides under your pillow to deliver sound therapy directly to your ears without disturbing a partner. A game-changer for nighttime tinnitus management.' },
    ]},
    { category: 'Hearing Protection', items: [
      { asin: 'B07N1XJ1C2', name: 'Loop Quiet Ear Plugs', desc: 'Stylish, reusable ear plugs that reduce noise by up to 27dB without muffling speech. Protecting your hearing is one of the most important steps in tinnitus management.' },
      { asin: 'B07VYBKGXP', name: 'Professional Hearing Protection Ear Muffs', desc: 'Over-ear protection rated NRR 28dB for concerts, power tools, or any loud environment. Preventing further noise damage is essential for anyone with tinnitus.' },
    ]},
    { category: 'Noise-Cancelling Audio', items: [
      { asin: 'B0CX23V2ZK', name: 'Sony WH-1000XM5 Headphones', desc: 'Industry-leading noise cancellation that can reduce environmental noise triggering tinnitus spikes. Also excellent for listening to sound therapy tracks at precise volumes.' },
      { asin: 'B09XS7JWHH', name: 'Apple AirPods Pro', desc: 'Active noise cancellation with transparency mode lets you control your sound environment. The adaptive EQ and comfortable fit make these ideal for extended sound therapy sessions.' },
      { asin: 'B0D1XD1ZV3', name: 'Bose QuietComfort Ultra Earbuds', desc: 'Premium noise cancellation with CustomTune technology that adapts to your ear shape. Bose\'s sound quality makes these excellent for both masking and music therapy.' },
      { asin: 'B0C1JB3GZH', name: 'Noise-Cancelling Sleep Earbuds', desc: 'Designed specifically for sleeping — low profile, comfortable for side sleepers, with built-in sound masking options.' },
    ]},
    { category: 'Mindfulness & Meditation', items: [
      { asin: 'B0797YBP7N', name: 'Meditation Cushion Zafu', desc: 'A quality meditation cushion supports proper posture during the mindfulness practices that research shows can significantly reduce tinnitus distress.' },
      { asin: 'B07BFNLMLH', name: 'Extra Thick Yoga Mat', desc: 'Body-based practices like yoga and gentle movement can help regulate the nervous system and reduce tinnitus reactivity. A supportive mat makes the practice sustainable.' },
      { asin: 'B08HMWZBXC', name: 'Journaling Notebook', desc: 'Tracking your tinnitus patterns, triggers, and emotional responses in a dedicated journal can reveal insights that transform your relationship with the sound.' },
    ]},
    { category: 'Stress & Sleep Support', items: [
      { asin: 'B07PFFMP9P', name: 'Weighted Blanket', desc: 'Deep pressure stimulation from a weighted blanket activates the parasympathetic nervous system, helping reduce the anxiety and sleep disruption that often accompany tinnitus.' },
      { asin: 'B0BDJ3GG9W', name: 'Lavender Essential Oil', desc: 'Research supports lavender\'s calming effects on the nervous system. Use in a diffuser before bed to create a relaxation ritual that supports better sleep with tinnitus.' },
      { asin: 'B0BVMKTTQN', name: 'Herbal Tea Sampler for Sleep', desc: 'Chamomile, valerian, and passionflower teas can support the relaxation response. A warm tea ritual before bed signals your nervous system to wind down.' },
      { asin: 'B0B5F76FB4', name: 'Melatonin Sleep Gummies', desc: 'For those nights when tinnitus makes falling asleep especially difficult. Melatonin can help reset your sleep cycle without the grogginess of prescription sleep aids.' },
      { asin: 'B0BX7GKBCP', name: 'Blue Light Blocking Glasses', desc: 'Reducing blue light exposure in the evening supports natural melatonin production — crucial for tinnitus sufferers who struggle with sleep onset.' },
    ]},
    { category: 'Body Work & Tension Relief', items: [
      { asin: 'B09DFCB66S', name: 'Theragun Mini Massage Gun', desc: 'Jaw tension, neck tightness, and TMJ issues can amplify tinnitus. A percussion massage device helps release the muscular tension that feeds into the tinnitus loop.' },
      { asin: 'B0BSHF7WHW', name: 'Acupressure Mat', desc: 'Stimulates pressure points that promote relaxation and endorphin release. Many tinnitus sufferers report reduced perception after regular use.' },
      { asin: 'B08MQZYSVC', name: 'Breathwork Training Device', desc: 'Guided breathing exercises are among the most effective tools for managing tinnitus-related anxiety. A training device helps you develop a consistent practice.' },
    ]},
    { category: 'Supplements', items: [
      { asin: 'B0CKWDS3QM', name: 'Magnesium Glycinate', desc: 'Research suggests magnesium may support auditory nerve function and reduce tinnitus severity. Glycinate is the most bioavailable and gentle form for daily supplementation.' },
    ]},
    { category: 'Essential Reading', items: [
      { asin: 'B07D23CFGR', name: 'Wherever You Go, There You Are — Jon Kabat-Zinn', desc: 'The foundational text on mindfulness that has helped millions change their relationship with chronic conditions, including tinnitus.' },
      { asin: 'B00HE67WQQ', name: 'Waking Up — Sam Harris', desc: 'A neuroscientist\'s exploration of consciousness and meditation that offers profound insights for anyone learning to live with persistent sound.' },
      { asin: 'B005LFYGJQ', name: 'The Power of Now — Eckhart Tolle', desc: 'Tolle\'s teachings on present-moment awareness offer a powerful framework for releasing the suffering that tinnitus can create.' },
      { asin: 'B074BDJFHX', name: 'The Body Keeps the Score — Bessel van der Kolk', desc: 'Understanding how the body stores and processes stress is essential for anyone whose tinnitus is connected to trauma or chronic tension.' },
      { asin: 'B0752FL328', name: 'Full Catastrophe Living — Jon Kabat-Zinn', desc: 'The complete guide to the MBSR program that has been clinically validated for tinnitus distress reduction.' },
    ]},
  ];

  const toolsHtml = TOOLS.map(cat => `
    <h2 style="margin-top:2.5rem;margin-bottom:1rem">${cat.category}</h2>
    <div class="tools-grid">
      ${cat.items.map(item => `<div class="tool-card">
        <h3><a href="https://www.amazon.com/dp/${item.asin}?tag=spankyspinola-20" rel="nofollow sponsored" target="_blank">${item.name}</a> <span style="font-size:0.75rem;color:#888;font-weight:400">(paid link)</span></h3>
        <p>${item.desc}</p>
      </div>`).join('')}
    </div>
  `).join('');

  const content = `
    <div class="page-content" style="max-width:1000px">
      <h1>Tools We Recommend</h1>
      <p>These are products we've researched, tested, or heard consistently positive feedback about from the tinnitus community. Every recommendation is chosen for its potential to genuinely help — not because of commission rates.</p>
      <div class="affiliate-disclosure" style="margin-bottom:2rem">
        <strong>Affiliate Disclosure:</strong> As an Amazon Associate, ${SITE.title} earns from qualifying purchases. Links on this page are affiliate links — if you buy through them, we may earn a small commission at no extra cost to you. This helps support our free content.
      </div>
      ${toolsHtml}
      <div class="health-disclaimer" style="margin-top:3rem">
        <h4>A Note on Supplements and Health Products</h4>
        <p>The products listed here are not intended to diagnose, treat, cure, or prevent any disease. Supplements and health products should be discussed with your healthcare provider before use, especially if you are taking medications or have underlying health conditions. Individual results may vary.</p>
      </div>
    </div>`;

  res.send(layout(
    `Tools We Recommend — ${SITE.title}`,
    'Curated tinnitus management products — sound machines, ear protection, mindfulness tools, and essential reading.',
    content,
    { canonical: `${SITE.url}/tools` }
  ));
});


// ─── SOUND MATCH ───
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
        therapies.push({ name: 'Pulsatile Tinnitus Evaluation', desc: 'Pulsing tinnitus that matches your heartbeat may have a vascular cause. Consider seeing an ENT specialist. In the meantime, nature sounds with rhythmic patterns may provide relief.' });
      }
      therapies.push({ name: 'Tinnitus Retraining Therapy (TRT)', desc: 'Developed by Pawel Jastreboff, TRT combines sound therapy with directive counseling. It works by habituating both the perception and reaction to tinnitus over 12-24 months.' });
      if (selections.tone === 'buzzing' || selections.tone === 'humming') {
        therapies.push({ name: 'Pink Noise Therapy', desc: 'Pink noise emphasizes lower frequencies and can be more soothing than white noise for buzzing or humming tinnitus.' });
      }
      therapies.push({ name: 'Mindfulness-Based Sound Meditation', desc: 'Rather than fighting the sound, mindfulness approaches teach you to observe tinnitus without resistance. Research shows this can significantly reduce tinnitus distress.' });
      results.style.display = 'block';
      results.innerHTML = '<h2 style="margin-bottom:1rem">Your Personalized Recommendations</h2>' +
        therapies.map(t => '<div style="margin-bottom:1.5rem"><h3 style="color:#008080;margin-bottom:0.3rem">' + t.name + '</h3><p>' + t.desc + '</p></div>').join('') +
        '<p style="margin-top:1.5rem;padding:1rem;background:#fff;border-radius:8px;font-size:0.9rem"><strong>Important:</strong> These suggestions are educational starting points. Please consult with an audiologist or ENT specialist for a personalized treatment plan.</p>';
      results.scrollIntoView({ behavior: 'smooth' });
    });
    </script>`;

  res.send(layout(
    `Find Your Sound Therapy — ${SITE.title}`,
    'Describe your tinnitus and discover personalized sound therapy approaches.',
    content,
    { canonical: `${SITE.url}/sound-match` }
  ));
});

// ─── QUIZZES ───
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

app.get('/quiz/:slug', (req, res) => {
  const quizzes = getQuizzes();
  const quiz = quizzes.find(q => q.slug === req.params.slug);
  if (!quiz) return res.status(404).send(render404());

  const ogImage = `${SITE.cdnBase}/images/og-default.png`;

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
            '<button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href)">Copy Link</button>' +
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent('I scored ' + pct + '% on ' + quiz.title + ' at ${SITE.title}') + '&url=' + encodeURIComponent('${SITE.url}/quiz/' + quiz.slug) + '" class="share-btn" rel="nofollow noopener" target="_blank">Share on X</a>' +
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

app.get('/quiz/:slug/result', (req, res) => {
  res.redirect(`/quiz/${req.params.slug}`);
});

// ─── ASSESSMENTS ───
app.get('/assessments', (req, res) => {
  const assessments = getAssessments();
  const content = `
    <div class="container">
      <h1 class="section-title">Tinnitus Self-Assessments</h1>
      <p style="margin-bottom:2rem;max-width:700px">These validated and research-informed assessments help you understand different dimensions of your tinnitus experience. Complete them periodically to track changes over time. You can save your results as a PDF to share with your healthcare provider.</p>
      <div class="masonry">
        ${assessments.map(a => `<a href="/assessment/${a.slug}" class="card" style="padding:1.5rem">
          <h3 style="font-size:1.1rem;margin-bottom:0.5rem">${a.title}</h3>
          <p style="font-size:0.9rem;color:#666;margin-bottom:0.5rem">${a.description}</p>
          <span class="cat-pill">${a.questions.length} Questions</span>
        </a>`).join('')}
      </div>
    </div>`;

  res.send(layout(
    `Self-Assessments — ${SITE.title}`,
    'Validated tinnitus self-assessments to understand and track your experience.',
    content,
    { canonical: `${SITE.url}/assessments` }
  ));
});

app.get('/assessment/:slug', (req, res) => {
  const assessments = getAssessments();
  const assessment = assessments.find(a => a.slug === req.params.slug);
  if (!assessment) return res.status(404).send(render404());

  const content = `
    <div class="container">
      <div class="quiz-container" id="assessmentApp" data-assessment='${JSON.stringify(assessment).replace(/'/g, "&#39;")}'>
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem">${assessment.title}</h1>
        <p style="color:#666;margin-bottom:1.5rem">${assessment.description}</p>
        <div class="quiz-progress"><div class="quiz-progress-bar" id="progressBar" style="width:0%"></div></div>
        <div id="assessmentContent"></div>
      </div>
    </div>

    <script>
    (function() {
      const assessment = JSON.parse(document.getElementById('assessmentApp').dataset.assessment);
      const container = document.getElementById('assessmentContent');
      const progressBar = document.getElementById('progressBar');
      let current = 0;
      const answers = [];

      function showQuestion() {
        if (current >= assessment.questions.length) return showResult();
        const q = assessment.questions[current];
        progressBar.style.width = ((current / assessment.questions.length) * 100) + '%';
        container.innerHTML = '<div class="quiz-question">' + q.question + '</div>' +
          '<div class="assessment-scale">' +
          q.options.map((opt, i) =>
            '<button class="assessment-scale" style="width:auto;height:auto;padding:0.8rem 1.2rem;border:2px solid #e8e8e0;border-radius:8px;background:#fff;cursor:pointer;text-align:left" data-score="' + opt.score + '">' +
            '<strong>' + opt.score + '</strong> — ' + opt.text + '</button>'
          ).join('') + '</div>';
        container.querySelectorAll('[data-score]').forEach(btn => {
          btn.addEventListener('click', () => {
            answers.push(parseInt(btn.dataset.score));
            current++;
            showQuestion();
          });
        });
      }

      function showResult() {
        progressBar.style.width = '100%';
        const total = answers.reduce((s, v) => s + v, 0);
        const max = assessment.questions.length * assessment.maxScore;
        const pct = Math.round((total / max) * 100);
        let level, message;
        for (const r of assessment.results) {
          if (pct <= r.maxPct) { level = r.level; message = r.message; break; }
        }
        if (!level) { const last = assessment.results[assessment.results.length - 1]; level = last.level; message = last.message; }

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        container.innerHTML = '<div class="quiz-result">' +
          '<h2>' + assessment.title + ' Results</h2>' +
          '<p style="font-size:2rem;font-weight:700;color:#008080;margin:1rem 0">' + total + ' / ' + max + '</p>' +
          '<p style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem">' + level + '</p>' +
          '<p style="margin:1rem 0;max-width:600px;margin-left:auto;margin-right:auto">' + message + '</p>' +
          '<p style="font-size:0.85rem;color:#888;margin-bottom:1.5rem">Completed on ' + date + '</p>' +
          '<button id="downloadPdf" style="padding:0.8rem 2rem;background:#008080;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:1rem;margin-bottom:1rem">Download PDF Report</button>' +
          '<div class="health-disclaimer" style="margin-top:2rem;text-align:left"><h4>Disclaimer</h4><p>This assessment is for informational and self-reflection purposes only. It is not a clinical diagnostic tool. Please share your results with a qualified healthcare provider for proper evaluation and guidance.</p></div>' +
        '</div>';

        document.getElementById('downloadPdf').addEventListener('click', () => {
          const w = window.open('', '_blank');
          w.document.write('<html><head><title>' + assessment.title + ' Results</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a2e}h1{color:#008080;font-size:1.5rem}h2{font-size:1.2rem;margin-top:1.5rem}.score{font-size:2rem;color:#008080;font-weight:bold;margin:1rem 0}.level{font-size:1.2rem;font-weight:600}.disclaimer{margin-top:2rem;padding:1rem;background:#f5f5f0;border-radius:8px;font-size:0.85rem;color:#666}table{width:100%;border-collapse:collapse;margin:1rem 0}td,th{padding:0.5rem;border:1px solid #ddd;text-align:left;font-size:0.9rem}@media print{body{margin:0}}</style></head><body>');
          w.document.write('<h1>' + assessment.title + '</h1>');
          w.document.write('<p>Completed: ' + date + '</p>');
          w.document.write('<p class="score">Score: ' + total + ' / ' + max + '</p>');
          w.document.write('<p class="level">' + level + '</p>');
          w.document.write('<p>' + message + '</p>');
          w.document.write('<h2>Your Responses</h2><table><tr><th>#</th><th>Question</th><th>Score</th></tr>');
          assessment.questions.forEach((q, i) => {
            w.document.write('<tr><td>' + (i+1) + '</td><td>' + q.question + '</td><td>' + answers[i] + '</td></tr>');
          });
          w.document.write('</table>');
          w.document.write('<div class="disclaimer"><strong>Disclaimer:</strong> This assessment is for informational purposes only and is not a clinical diagnostic tool. Please consult a qualified healthcare provider for proper evaluation. Generated by The Ringing Truth (ringingtruth.com)</div>');
          w.document.write('</body></html>');
          w.document.close();
          w.print();
        });
      }

      showQuestion();
    })();
    </script>`;

  res.send(layout(
    `${assessment.title} — ${SITE.title}`,
    assessment.description,
    content,
    { canonical: `${SITE.url}/assessment/${assessment.slug}` }
  ));
});


// ─── API ROUTES ───
app.post('/api/subscribe', async (req, res) => {
  const { email, source } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const entry = JSON.stringify({ email, date: new Date().toISOString(), source: source || 'unknown' });
  try {
    await fetch(`https://ny.storage.bunnycdn.com/ringing-truth/data/subscribers.jsonl`, {
      method: 'PUT',
      headers: { 'AccessKey': '282422b3-a99c-4aba-b8c3cbf33e3e-2344-4772', 'Content-Type': 'application/octet-stream' },
      body: entry + '\n',
    });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
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

app.get('/llms-full.txt', (req, res) => {
  const published = getPublished();
  let text = `# ${SITE.title} — Full Article Index\n# Author: Kalesh\n# ${published.length} articles\n\n`;
  for (const a of published) {
    text += `## ${a.title}\nURL: ${SITE.url}/articles/${a.slug}\nCategory: ${a.categoryName}\nDate: ${a.dateISO}\nDescription: ${a.metaDescription || ''}\n\n`;
  }
  res.type('text/plain').send(text);
});

app.get('/.well-known/ai.json', (req, res) => {
  const published = getPublished();
  res.json({
    schema_version: "1.0", name: SITE.title, description: SITE.subtitle, url: SITE.url,
    author: { name: "Kalesh", title: SITE.authorTitle, url: SITE.authorLink },
    topics: CATEGORIES.map(c => c.name), article_count: published.length,
    endpoints: { identity: "/api/ai/identity", topics: "/api/ai/topics", ask: "/api/ai/ask", articles: "/api/ai/articles", sitemap: "/api/ai/sitemap" }
  });
});

app.get('/api/ai/identity', (req, res) => {
  res.json({ name: SITE.title, author: "Kalesh", author_title: SITE.authorTitle, author_url: SITE.authorLink, description: `${SITE.title} — ${SITE.subtitle}. ${SITE.tagline}`, url: SITE.url, article_count: getPublished().length });
});

app.get('/api/ai/topics', (req, res) => {
  res.json({ topics: CATEGORIES.map(c => ({ name: c.name, slug: c.slug, article_count: getArticlesByCategory(c.slug).length, url: `${SITE.url}/category/${c.slug}` })) });
});

app.get('/api/ai/ask', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const matches = getPublished().filter(a => a.title.toLowerCase().includes(q) || (a.metaDescription || '').toLowerCase().includes(q)).slice(0, 5);
  res.json({ query: q, results: matches.map(a => ({ title: a.title, url: `${SITE.url}/articles/${a.slug}`, description: a.metaDescription, category: a.categoryName })) });
});

app.get('/api/ai/articles', (req, res) => {
  const published = getPublished();
  res.json({ total: published.length, articles: published.slice(0, 50).map(a => ({ title: a.title, url: `${SITE.url}/articles/${a.slug}`, category: a.categoryName, date: a.dateISO, description: a.metaDescription })) });
});

app.get('/api/ai/sitemap', (req, res) => {
  const published = getPublished();
  res.json({ pages: [
    { url: SITE.url, title: SITE.title },
    { url: `${SITE.url}/articles`, title: 'All Articles' },
    { url: `${SITE.url}/about`, title: 'About' },
    { url: `${SITE.url}/start-here`, title: 'Start Here' },
    { url: `${SITE.url}/tools`, title: 'Tools We Recommend' },
    { url: `${SITE.url}/sound-match`, title: 'Find Your Sound Therapy' },
    { url: `${SITE.url}/quizzes`, title: 'Quizzes' },
    { url: `${SITE.url}/assessments`, title: 'Assessments' },
    ...CATEGORIES.map(c => ({ url: `${SITE.url}/category/${c.slug}`, title: c.name })),
    ...published.map(a => ({ url: `${SITE.url}/articles/${a.slug}`, title: a.title }))
  ]});
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
    { loc: `${SITE.url}/tools`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE.url}/sound-match`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE.url}/quizzes`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE.url}/assessments`, priority: '0.7', changefreq: 'monthly' },
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

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/subscribe
Disallow: /api/cron/

Sitemap: ${SITE.url}/sitemap-index.xml

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

User-agent: ClaudeBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Discordbot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: AhrefsBot
Allow: /

User-agent: SemrushBot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: AI2Bot
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
      <p style="max-width:500px;margin-bottom:2rem;color:#666">Sometimes the path takes an unexpected turn. That's okay — there's plenty to explore.</p>
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
      description: 'Test your understanding of the fundamentals of tinnitus.',
      questions: [
        { question: 'Where does tinnitus originate?', options: [{ text: 'The ear canal', correct: false }, { text: 'The brain', correct: true }, { text: 'The eardrum', correct: false }, { text: 'The jaw', correct: false }] },
        { question: 'What percentage of adults experience tinnitus at some point?', options: [{ text: '5-10%', correct: false }, { text: '10-15%', correct: true }, { text: '25-30%', correct: false }, { text: '1-2%', correct: false }] },
        { question: 'What is Tinnitus Retraining Therapy (TRT)?', options: [{ text: 'Surgery to remove tinnitus', correct: false }, { text: 'Sound therapy + counseling for habituation', correct: true }, { text: 'A medication protocol', correct: false }, { text: 'Hearing aid adjustment', correct: false }] },
        { question: 'Which researcher developed TRT?', options: [{ text: 'David Baguley', correct: false }, { text: 'Susan Shore', correct: false }, { text: 'Pawel Jastreboff', correct: true }, { text: 'Josef Rauschecker', correct: false }] },
        { question: 'Can tinnitus be "cured" in most cases?', options: [{ text: 'Yes, with the right medication', correct: false }, { text: 'No, but it can be effectively managed', correct: true }, { text: 'Yes, through surgery', correct: false }, { text: 'Only in children', correct: false }] },
      ],
      results: { high: 'Excellent! You have a strong understanding of tinnitus fundamentals.', medium: 'Good foundation! There is more to discover.', low: 'Tinnitus is complex — explore our Science category.' }
    },
    {
      slug: 'sound-therapy-knowledge',
      title: 'Sound Therapy: What Works and Why?',
      description: 'Explore your knowledge of sound-based approaches to tinnitus management.',
      questions: [
        { question: 'What is the goal of sound masking?', options: [{ text: 'Eliminate tinnitus permanently', correct: false }, { text: 'Reduce the contrast between tinnitus and silence', correct: true }, { text: 'Damage the tinnitus signal', correct: false }, { text: 'Increase hearing sensitivity', correct: false }] },
        { question: 'What is notched sound therapy?', options: [{ text: 'Music with a frequency gap at the tinnitus pitch', correct: true }, { text: 'Loud noise exposure therapy', correct: false }, { text: 'Silence-based meditation', correct: false }, { text: 'Hearing aid amplification', correct: false }] },
        { question: 'Which type of noise has equal energy per octave?', options: [{ text: 'White noise', correct: false }, { text: 'Pink noise', correct: true }, { text: 'Brown noise', correct: false }, { text: 'Blue noise', correct: false }] },
        { question: 'How long does TRT typically take?', options: [{ text: '1-2 weeks', correct: false }, { text: '1-3 months', correct: false }, { text: '12-24 months', correct: true }, { text: '5+ years', correct: false }] },
        { question: 'Should masking sounds completely cover tinnitus?', options: [{ text: 'Yes, louder is better', correct: false }, { text: 'No, partial masking is recommended', correct: true }, { text: 'It depends on the time of day', correct: false }, { text: 'Only during sleep', correct: false }] },
      ],
      results: { high: 'You know your sound therapy well!', medium: 'Solid understanding. Our Management category has more.', low: 'Sound therapy is powerful — start with our beginner guides.' }
    },
    {
      slug: 'tinnitus-and-mental-health',
      title: 'Tinnitus & Mental Health Connection',
      description: 'Understand the relationship between tinnitus, anxiety, and emotional wellbeing.',
      questions: [
        { question: 'What is the tinnitus-anxiety loop?', options: [{ text: 'Tinnitus causes anxiety which amplifies tinnitus perception', correct: true }, { text: 'Anxiety medication causes tinnitus', correct: false }, { text: 'Tinnitus only appears during panic attacks', correct: false }, { text: 'Anxiety cures tinnitus', correct: false }] },
        { question: 'Which therapy is most evidence-based for tinnitus distress?', options: [{ text: 'Psychoanalysis', correct: false }, { text: 'CBT (Cognitive Behavioral Therapy)', correct: true }, { text: 'Hypnotherapy', correct: false }, { text: 'Art therapy', correct: false }] },
        { question: 'How does stress affect tinnitus?', options: [{ text: 'It has no effect', correct: false }, { text: 'It can increase perceived loudness and distress', correct: true }, { text: 'It always makes tinnitus quieter', correct: false }, { text: 'It only affects pulsatile tinnitus', correct: false }] },
        { question: 'What role does the amygdala play?', options: [{ text: 'It generates the tinnitus sound', correct: false }, { text: 'It processes the emotional response to tinnitus', correct: true }, { text: 'It controls ear muscles', correct: false }, { text: 'None', correct: false }] },
        { question: 'Can mindfulness meditation help with tinnitus?', options: [{ text: 'No, silence makes it worse', correct: false }, { text: 'Yes, it can reduce distress and change the relationship to the sound', correct: true }, { text: 'Only if combined with medication', correct: false }, { text: 'It eliminates the sound', correct: false }] },
      ],
      results: { high: 'You understand the mind-tinnitus connection deeply.', medium: 'Good awareness! The psychological dimension is crucial.', low: 'The mind plays a bigger role than most realize.' }
    },
    {
      slug: 'body-and-tinnitus',
      title: 'Your Body & Tinnitus',
      description: 'Discover how physical health influences tinnitus.',
      questions: [
        { question: 'Can TMJ disorders contribute to tinnitus?', options: [{ text: 'No, they are unrelated', correct: false }, { text: 'Yes, jaw tension can affect ear function', correct: true }, { text: 'Only in elderly patients', correct: false }, { text: 'Only if you grind your teeth', correct: false }] },
        { question: 'How can neck tension affect tinnitus?', options: [{ text: 'It cannot', correct: false }, { text: 'Cervical spine issues can modulate tinnitus', correct: true }, { text: 'Only through hearing loss', correct: false }, { text: 'Only during exercise', correct: false }] },
        { question: 'Which supplement shows promise for tinnitus?', options: [{ text: 'Vitamin C', correct: false }, { text: 'Magnesium', correct: true }, { text: 'Iron', correct: false }, { text: 'Calcium', correct: false }] },
        { question: 'Does exercise help tinnitus?', options: [{ text: 'No, it makes it worse', correct: false }, { text: 'Yes, moderate exercise can reduce tinnitus distress', correct: true }, { text: 'Only swimming', correct: false }, { text: 'Only if done silently', correct: false }] },
        { question: 'Can dehydration affect tinnitus?', options: [{ text: 'No connection', correct: false }, { text: 'Yes, dehydration can temporarily worsen tinnitus', correct: true }, { text: 'It cures tinnitus', correct: false }, { text: 'Only in hot weather', correct: false }] },
      ],
      results: { high: 'Great body awareness!', medium: 'Good start — explore our Body category.', low: 'Your body plays a bigger role than you might think.' }
    },
    {
      slug: 'deeper-listening',
      title: 'The Deeper Listening: Tinnitus & Awareness',
      description: 'Explore the contemplative and philosophical dimensions of tinnitus.',
      questions: [
        { question: 'What does "habituation" mean in tinnitus context?', options: [{ text: 'The sound gets louder', correct: false }, { text: 'The brain learns to filter out the tinnitus signal', correct: true }, { text: 'You lose your hearing', correct: false }, { text: 'The tinnitus moves to the other ear', correct: false }] },
        { question: 'How can tinnitus be viewed as a teacher?', options: [{ text: 'It cannot', correct: false }, { text: 'It forces present-moment awareness and acceptance', correct: true }, { text: 'It teaches you to be louder', correct: false }, { text: 'It only teaches patience', correct: false }] },
        { question: 'What is the "observer" in mindfulness practice?', options: [{ text: 'Your doctor', correct: false }, { text: 'The part of awareness that watches experience without judgment', correct: true }, { text: 'A meditation app', correct: false }, { text: 'Your inner critic', correct: false }] },
        { question: 'Can acceptance of tinnitus reduce suffering?', options: [{ text: 'No, you should always fight it', correct: false }, { text: 'Yes, acceptance reduces the emotional amplification of the sound', correct: true }, { text: 'Only temporarily', correct: false }, { text: 'Acceptance means giving up', correct: false }] },
        { question: 'What is neuroplasticity\'s role in tinnitus?', options: [{ text: 'None', correct: false }, { text: 'The brain can rewire its response to tinnitus over time', correct: true }, { text: 'It only applies to children', correct: false }, { text: 'It makes tinnitus permanent', correct: false }] },
      ],
      results: { high: 'You have deep insight into the contemplative dimension.', medium: 'Beautiful start — our Deeper Listening category awaits.', low: 'There is a profound dimension to explore.' }
    },
    {
      slug: 'sleep-and-tinnitus',
      title: 'Sleep & Tinnitus',
      description: 'Test your knowledge about managing tinnitus during sleep.',
      questions: [
        { question: 'Why is tinnitus often worse at night?', options: [{ text: 'The tinnitus gets louder', correct: false }, { text: 'Reduced ambient noise increases tinnitus perception', correct: true }, { text: 'Lying down damages hearing', correct: false }, { text: 'It is not worse at night', correct: false }] },
        { question: 'What is the best sound level for sleep masking?', options: [{ text: 'As loud as possible', correct: false }, { text: 'Just below the tinnitus level', correct: true }, { text: 'Complete silence', correct: false }, { text: 'Maximum volume', correct: false }] },
        { question: 'Can sleep hygiene help tinnitus?', options: [{ text: 'No connection', correct: false }, { text: 'Yes, consistent sleep habits reduce tinnitus distress', correct: true }, { text: 'Only medication helps', correct: false }, { text: 'Sleep makes tinnitus worse', correct: false }] },
        { question: 'Which is better for sleep: white or pink noise?', options: [{ text: 'White noise is always better', correct: false }, { text: 'Pink noise is often preferred for its gentler quality', correct: true }, { text: 'Neither helps', correct: false }, { text: 'Brown noise only', correct: false }] },
        { question: 'Should you use earbuds or speakers for sleep sound?', options: [{ text: 'Always earbuds', correct: false }, { text: 'Both work — speakers or pillow speakers avoid ear canal irritation', correct: true }, { text: 'Never use any sound', correct: false }, { text: 'Only hearing aids', correct: false }] },
      ],
      results: { high: 'Excellent sleep knowledge!', medium: 'Good foundation for better sleep.', low: 'Sleep is crucial — explore our sleep articles.' }
    },
    {
      slug: 'nutrition-and-tinnitus',
      title: 'Nutrition & Tinnitus',
      description: 'Explore how diet and nutrition affect tinnitus.',
      questions: [
        { question: 'Can caffeine worsen tinnitus?', options: [{ text: 'Always', correct: false }, { text: 'It varies — some people are sensitive, others are not', correct: true }, { text: 'Never', correct: false }, { text: 'Only decaf', correct: false }] },
        { question: 'Does salt intake affect tinnitus?', options: [{ text: 'No connection', correct: false }, { text: 'High sodium can increase fluid pressure and worsen tinnitus', correct: true }, { text: 'More salt helps', correct: false }, { text: 'Only sea salt', correct: false }] },
        { question: 'Which vitamin deficiency is linked to tinnitus?', options: [{ text: 'Vitamin A', correct: false }, { text: 'Vitamin B12', correct: true }, { text: 'Vitamin C', correct: false }, { text: 'Vitamin E', correct: false }] },
        { question: 'Can alcohol affect tinnitus?', options: [{ text: 'It cures tinnitus', correct: false }, { text: 'It can temporarily worsen tinnitus by dilating blood vessels', correct: true }, { text: 'No effect', correct: false }, { text: 'Only wine', correct: false }] },
        { question: 'Is an anti-inflammatory diet helpful?', options: [{ text: 'No evidence', correct: false }, { text: 'Yes, reducing inflammation may support auditory health', correct: true }, { text: 'Only for pulsatile tinnitus', correct: false }, { text: 'It makes tinnitus worse', correct: false }] },
      ],
      results: { high: 'Great nutritional awareness!', medium: 'Good start — diet matters more than most realize.', low: 'Nutrition plays a real role in tinnitus.' }
    },
    {
      slug: 'tinnitus-myths',
      title: 'Tinnitus Myths vs. Facts',
      description: 'Can you separate tinnitus fact from fiction?',
      questions: [
        { question: 'Myth or Fact: Tinnitus always means hearing loss.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — tinnitus can occur without measurable hearing loss', correct: true }] },
        { question: 'Myth or Fact: There is no treatment for tinnitus.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — many effective management strategies exist', correct: true }] },
        { question: 'Myth or Fact: Only older people get tinnitus.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — tinnitus affects all age groups', correct: true }] },
        { question: 'Myth or Fact: Tinnitus is always caused by loud noise.', options: [{ text: 'Fact', correct: false }, { text: 'Myth — many causes exist including stress, medication, and TMJ', correct: true }] },
        { question: 'Myth or Fact: You can habituate to tinnitus.', options: [{ text: 'Myth', correct: false }, { text: 'Fact — the brain can learn to filter out the signal', correct: true }] },
      ],
      results: { high: 'Myth-buster! You know your facts.', medium: 'Some myths still linger — keep learning.', low: 'Many common beliefs about tinnitus are wrong.' }
    },
    {
      slug: 'tinnitus-management-strategies',
      title: 'Your Tinnitus Management Toolkit',
      description: 'How well do you know the full range of management options?',
      questions: [
        { question: 'What is the first step in tinnitus management?', options: [{ text: 'Buy a sound machine', correct: false }, { text: 'Get a proper audiological evaluation', correct: true }, { text: 'Start meditation', correct: false }, { text: 'Take supplements', correct: false }] },
        { question: 'Which professional should you see first?', options: [{ text: 'A psychiatrist', correct: false }, { text: 'An audiologist or ENT specialist', correct: true }, { text: 'A chiropractor', correct: false }, { text: 'A nutritionist', correct: false }] },
        { question: 'What is a multi-modal approach?', options: [{ text: 'Using one treatment at a time', correct: false }, { text: 'Combining multiple strategies like sound therapy, CBT, and lifestyle changes', correct: true }, { text: 'Only using medication', correct: false }, { text: 'Ignoring tinnitus completely', correct: false }] },
        { question: 'How important is stress management?', options: [{ text: 'Not important', correct: false }, { text: 'Critical — stress is one of the biggest amplifiers of tinnitus', correct: true }, { text: 'Only for severe cases', correct: false }, { text: 'Only during flare-ups', correct: false }] },
        { question: 'Should you avoid silence completely?', options: [{ text: 'Yes, always have noise', correct: false }, { text: 'Not necessarily — gradual exposure to quiet can be therapeutic', correct: true }, { text: 'Silence cures tinnitus', correct: false }, { text: 'Only at night', correct: false }] },
      ],
      results: { high: 'You have a comprehensive management toolkit!', medium: 'Good foundation — there are more strategies to explore.', low: 'Many effective tools await you.' }
    },
  ];
}

// ─── ASSESSMENT DATA ───
function getAssessments() {
  return [
    {
      slug: 'tinnitus-handicap-inventory',
      title: 'Tinnitus Handicap Inventory (THI)',
      description: 'A widely-used 25-question assessment measuring the impact of tinnitus on daily life, emotional wellbeing, and functional ability.',
      maxScore: 4,
      questions: [
        { question: 'Because of your tinnitus, is it difficult for you to concentrate?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Does the loudness of your tinnitus make it difficult to hear people?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Does your tinnitus make you angry?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Does your tinnitus make you feel confused?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Because of your tinnitus, do you feel desperate?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Do you complain a great deal about your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Because of your tinnitus, do you have trouble falling asleep?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Do you feel as though you cannot escape your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Does your tinnitus interfere with your ability to enjoy social activities?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Because of your tinnitus, do you feel frustrated?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
      ],
      results: [
        { maxPct: 20, level: 'Slight (Grade 1)', message: 'Your tinnitus has a minimal impact on daily life. Continue monitoring and maintaining healthy habits.' },
        { maxPct: 40, level: 'Mild (Grade 2)', message: 'Your tinnitus causes some difficulty. Sound therapy and stress management techniques may be beneficial.' },
        { maxPct: 60, level: 'Moderate (Grade 3)', message: 'Tinnitus is noticeably affecting your quality of life. Consider consulting an audiologist and exploring CBT or TRT.' },
        { maxPct: 80, level: 'Severe (Grade 4)', message: 'Tinnitus is significantly impacting your daily functioning. Professional support from an audiologist and mental health provider is recommended.' },
        { maxPct: 100, level: 'Catastrophic (Grade 5)', message: 'Tinnitus is severely affecting your life. Please seek professional help promptly — effective treatments exist.' },
      ]
    },
    {
      slug: 'tinnitus-functional-index',
      title: 'Tinnitus Functional Index (TFI)',
      description: 'Measures the severity and impact of tinnitus across 8 domains including sleep, relaxation, concentration, and sense of control.',
      maxScore: 4,
      questions: [
        { question: 'How much of the time were you aware of your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Most of the time', score: 3 }, { text: 'All of the time', score: 4 }] },
        { question: 'How strong or loud was your tinnitus?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very', score: 3 }, { text: 'Extremely', score: 4 }] },
        { question: 'How much did your tinnitus bother you?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very much', score: 3 }, { text: 'Extremely', score: 4 }] },
        { question: 'How easy was it for you to cope with your tinnitus?', options: [{ text: 'Very easy', score: 0 }, { text: 'Easy', score: 1 }, { text: 'Moderate', score: 2 }, { text: 'Difficult', score: 3 }, { text: 'Very difficult', score: 4 }] },
        { question: 'How much did tinnitus interfere with your ability to concentrate?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very much', score: 3 }, { text: 'Extremely', score: 4 }] },
        { question: 'How much did tinnitus interfere with falling asleep?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very much', score: 3 }, { text: 'Extremely', score: 4 }] },
        { question: 'How much did tinnitus interfere with staying asleep?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very much', score: 3 }, { text: 'Extremely', score: 4 }] },
        { question: 'How much did tinnitus interfere with your ability to relax?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Very much', score: 3 }, { text: 'Extremely', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Mild Impact', message: 'Your tinnitus has a relatively low functional impact. Maintain your current coping strategies.' },
        { maxPct: 50, level: 'Moderate Impact', message: 'Tinnitus is moderately affecting your daily functioning. Consider structured management approaches.' },
        { maxPct: 75, level: 'Significant Impact', message: 'Tinnitus is significantly interfering with daily activities. Professional guidance is recommended.' },
        { maxPct: 100, level: 'Severe Impact', message: 'Tinnitus is severely impacting your quality of life. Please seek professional support.' },
      ]
    },
    {
      slug: 'tinnitus-anxiety-assessment',
      title: 'Tinnitus-Related Anxiety Assessment',
      description: 'Evaluate how much anxiety your tinnitus generates and how it affects your emotional state.',
      maxScore: 4,
      questions: [
        { question: 'How often do you feel anxious about your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'Do you worry that your tinnitus will get worse?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'Does tinnitus make you feel panicky or overwhelmed?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'Do you avoid quiet situations because of tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Does thinking about your tinnitus increase your heart rate or tension?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Do you feel helpless about your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Low Anxiety', message: 'Your tinnitus-related anxiety is manageable. Continue your current coping strategies.' },
        { maxPct: 50, level: 'Moderate Anxiety', message: 'You experience notable anxiety around tinnitus. Mindfulness and CBT techniques may help.' },
        { maxPct: 75, level: 'High Anxiety', message: 'Tinnitus is causing significant anxiety. Consider working with a therapist experienced in tinnitus.' },
        { maxPct: 100, level: 'Severe Anxiety', message: 'Your tinnitus-related anxiety is severe. Professional mental health support is strongly recommended.' },
      ]
    },
    {
      slug: 'sleep-quality-tinnitus',
      title: 'Tinnitus Sleep Quality Assessment',
      description: 'Evaluate how tinnitus affects your sleep patterns and nighttime experience.',
      maxScore: 4,
      questions: [
        { question: 'How long does it typically take you to fall asleep?', options: [{ text: 'Less than 15 minutes', score: 0 }, { text: '15-30 minutes', score: 1 }, { text: '30-60 minutes', score: 2 }, { text: '1-2 hours', score: 3 }, { text: 'More than 2 hours', score: 4 }] },
        { question: 'How often does tinnitus wake you during the night?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: '1-2 times per week', score: 2 }, { text: '3-5 times per week', score: 3 }, { text: 'Every night', score: 4 }] },
        { question: 'How rested do you feel upon waking?', options: [{ text: 'Very rested', score: 0 }, { text: 'Somewhat rested', score: 1 }, { text: 'Neutral', score: 2 }, { text: 'Tired', score: 3 }, { text: 'Exhausted', score: 4 }] },
        { question: 'Do you use sound masking to sleep?', options: [{ text: 'No, I sleep fine without it', score: 0 }, { text: 'Occasionally', score: 1 }, { text: 'Most nights', score: 2 }, { text: 'Every night', score: 3 }, { text: 'Even with masking, I struggle', score: 4 }] },
        { question: 'How much does tinnitus affect your overall sleep quality?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'Severely', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Good Sleep Quality', message: 'Tinnitus has minimal impact on your sleep. Keep up your good sleep habits.' },
        { maxPct: 50, level: 'Moderate Sleep Disruption', message: 'Tinnitus is moderately affecting your sleep. Sound therapy and sleep hygiene improvements may help.' },
        { maxPct: 75, level: 'Significant Sleep Disruption', message: 'Your sleep is significantly affected. Consider a dedicated sleep sound machine and consulting a sleep specialist.' },
        { maxPct: 100, level: 'Severe Sleep Disruption', message: 'Tinnitus is severely impacting your sleep. Professional evaluation for both tinnitus and sleep is recommended.' },
      ]
    },
    {
      slug: 'coping-strategies-inventory',
      title: 'Tinnitus Coping Strategies Inventory',
      description: 'Assess which coping strategies you currently use and identify areas for improvement.',
      maxScore: 4,
      questions: [
        { question: 'How often do you use sound enrichment (background sound)?', options: [{ text: 'Regularly and effectively', score: 0 }, { text: 'Often', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Rarely', score: 3 }, { text: 'Never', score: 4 }] },
        { question: 'How often do you practice relaxation techniques?', options: [{ text: 'Daily', score: 0 }, { text: 'Several times a week', score: 1 }, { text: 'Weekly', score: 2 }, { text: 'Rarely', score: 3 }, { text: 'Never', score: 4 }] },
        { question: 'Do you engage in regular physical exercise?', options: [{ text: '5+ times per week', score: 0 }, { text: '3-4 times per week', score: 1 }, { text: '1-2 times per week', score: 2 }, { text: 'Rarely', score: 3 }, { text: 'Never', score: 4 }] },
        { question: 'Do you have a consistent sleep routine?', options: [{ text: 'Very consistent', score: 0 }, { text: 'Mostly consistent', score: 1 }, { text: 'Somewhat', score: 2 }, { text: 'Inconsistent', score: 3 }, { text: 'No routine', score: 4 }] },
        { question: 'Do you practice mindfulness or meditation?', options: [{ text: 'Daily', score: 0 }, { text: 'Several times a week', score: 1 }, { text: 'Weekly', score: 2 }, { text: 'Rarely', score: 3 }, { text: 'Never', score: 4 }] },
        { question: 'Do you seek social support for your tinnitus?', options: [{ text: 'Regularly', score: 0 }, { text: 'Sometimes', score: 1 }, { text: 'Occasionally', score: 2 }, { text: 'Rarely', score: 3 }, { text: 'Never — I deal with it alone', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Strong Coping Toolkit', message: 'You have excellent coping strategies in place. Keep refining what works for you.' },
        { maxPct: 50, level: 'Good Foundation', message: 'You have some strategies in place. Consider adding mindfulness or sound therapy to strengthen your toolkit.' },
        { maxPct: 75, level: 'Room for Growth', message: 'There are many effective strategies you could benefit from. Our articles can guide you.' },
        { maxPct: 100, level: 'Building Your Toolkit', message: 'You have significant room to develop coping strategies. Start with our Start Here guide.' },
      ]
    },
    {
      slug: 'emotional-impact-scale',
      title: 'Tinnitus Emotional Impact Scale',
      description: 'Measure the emotional burden of tinnitus across frustration, sadness, anger, and hope.',
      maxScore: 4,
      questions: [
        { question: 'How often does tinnitus make you feel frustrated?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'How often does tinnitus make you feel sad or down?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'How often does tinnitus make you feel irritable or angry?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'How hopeful are you about managing your tinnitus?', options: [{ text: 'Very hopeful', score: 0 }, { text: 'Somewhat hopeful', score: 1 }, { text: 'Neutral', score: 2 }, { text: 'Not very hopeful', score: 3 }, { text: 'Hopeless', score: 4 }] },
        { question: 'Does tinnitus affect your sense of identity or self-worth?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'Profoundly', score: 4 }] },
        { question: 'How often do you feel isolated because of your tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Low Emotional Impact', message: 'Tinnitus has a minimal emotional impact on you. Your resilience is strong.' },
        { maxPct: 50, level: 'Moderate Emotional Impact', message: 'Tinnitus is causing some emotional strain. Mindfulness and support groups may help.' },
        { maxPct: 75, level: 'High Emotional Impact', message: 'The emotional burden is significant. Consider speaking with a therapist who understands tinnitus.' },
        { maxPct: 100, level: 'Severe Emotional Impact', message: 'Tinnitus is taking a heavy emotional toll. Professional support is strongly recommended.' },
      ]
    },
    {
      slug: 'concentration-focus',
      title: 'Tinnitus & Concentration Assessment',
      description: 'Evaluate how tinnitus affects your ability to focus, work, and engage in cognitive tasks.',
      maxScore: 4,
      questions: [
        { question: 'How much does tinnitus interfere with reading?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'Severely', score: 4 }] },
        { question: 'How much does tinnitus interfere with work or study?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'Severely', score: 4 }] },
        { question: 'Can you follow conversations in quiet environments?', options: [{ text: 'Easily', score: 0 }, { text: 'Usually', score: 1 }, { text: 'With some difficulty', score: 2 }, { text: 'With great difficulty', score: 3 }, { text: 'Cannot', score: 4 }] },
        { question: 'How often do you lose your train of thought due to tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
        { question: 'Does background noise help or hinder your concentration?', options: [{ text: 'Background noise helps a lot', score: 0 }, { text: 'It helps somewhat', score: 1 }, { text: 'No difference', score: 2 }, { text: 'It makes things worse', score: 3 }, { text: 'Nothing helps', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Minimal Concentration Impact', message: 'Tinnitus has little effect on your concentration. Your focus strategies are working well.' },
        { maxPct: 50, level: 'Moderate Concentration Impact', message: 'Tinnitus moderately affects your focus. Background sound enrichment may help.' },
        { maxPct: 75, level: 'Significant Concentration Impact', message: 'Your concentration is significantly affected. Consider structured sound therapy during work.' },
        { maxPct: 100, level: 'Severe Concentration Impact', message: 'Tinnitus is severely impacting your ability to concentrate. Professional evaluation is recommended.' },
      ]
    },
    {
      slug: 'social-impact',
      title: 'Tinnitus Social Impact Assessment',
      description: 'Measure how tinnitus affects your social life, relationships, and daily interactions.',
      maxScore: 4,
      questions: [
        { question: 'How much does tinnitus affect your enjoyment of social gatherings?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'I avoid them', score: 4 }] },
        { question: 'Do you avoid restaurants or noisy venues because of tinnitus?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Always', score: 4 }] },
        { question: 'Has tinnitus affected your close relationships?', options: [{ text: 'Not at all', score: 0 }, { text: 'Slightly', score: 1 }, { text: 'Moderately', score: 2 }, { text: 'Significantly', score: 3 }, { text: 'Severely', score: 4 }] },
        { question: 'Do people around you understand your tinnitus experience?', options: [{ text: 'Very well', score: 0 }, { text: 'Somewhat', score: 1 }, { text: 'A little', score: 2 }, { text: 'Not really', score: 3 }, { text: 'Not at all', score: 4 }] },
        { question: 'How often do you feel like withdrawing from social situations?', options: [{ text: 'Never', score: 0 }, { text: 'Rarely', score: 1 }, { text: 'Sometimes', score: 2 }, { text: 'Often', score: 3 }, { text: 'Constantly', score: 4 }] },
      ],
      results: [
        { maxPct: 25, level: 'Low Social Impact', message: 'Tinnitus has minimal effect on your social life. Keep engaging with your community.' },
        { maxPct: 50, level: 'Moderate Social Impact', message: 'Tinnitus moderately affects your social interactions. Communication strategies can help.' },
        { maxPct: 75, level: 'Significant Social Impact', message: 'Your social life is significantly affected. Support groups and hearing strategies may help.' },
        { maxPct: 100, level: 'Severe Social Impact', message: 'Tinnitus is severely limiting your social engagement. Professional support is recommended.' },
      ]
    },
  ];
}

// ─── HEALTH CHECK ───
app.get('/health', (req, res) => {
  res.json({ status: 'ok', articles: articles.length, published: getPublished().length, uptime: process.uptime() });
});

// ─── START SERVER ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`${SITE.title} running on 0.0.0.0:${PORT}`);
  console.log(`Articles: ${articles.length} total, ${getPublished().length} published`);
});
