export function matchProducts({ articleTitle, articleTags, articleCategory, catalog, minLinks = 3, maxLinks = 4 }) {
  if (typeof articleTitle !== 'string') throw new TypeError('articleTitle must be string');
  if (!Array.isArray(articleTags)) throw new TypeError('articleTags must be array');
  if (typeof articleCategory !== 'string') throw new TypeError('articleCategory must be string');
  if (!Array.isArray(catalog)) throw new TypeError('catalog must be array');

  const scored = catalog.map(p => ({ product: p, score: score(p, articleTitle, articleTags, articleCategory) }))
    .sort((a, b) => b.score - a.score);
  const take = Math.min(maxLinks, Math.max(minLinks, Math.min(scored.length, maxLinks)));
  return scored.slice(0, take).map(s => s.product);
}

function score(product, title, tags, category) {
  let s = 0;
  const pTags = Array.isArray(product.tags) ? product.tags : [];
  const pCat = product.category || '';
  if (pCat === category) s += 10;
  for (const t of tags) {
    if (pTags.includes(t)) s += 3;
    if ((product.name || '').toLowerCase().includes(t.toLowerCase())) s += 2;
  }
  const words = title.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const name = (product.name || '').toLowerCase();
  for (const w of words) if (name.includes(w)) s += 2;
  // Category keyword matching
  const catWords = category.toLowerCase().split(/[-_\s]+/);
  for (const cw of catWords) if (name.includes(cw)) s += 1;
  return s;
}
