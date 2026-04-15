// 30-day content refresh: updates 10 oldest articles with fresh voice, links, and humanization
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GH_PAT = process.env.GH_PAT;
const EDITORIAL_NAME = 'The Ringing Truth Editorial';

const BANNED_WORDS = ['profound', 'transformative', 'holistic', 'nuanced', 'multifaceted',
  'manifest', 'manifestation', 'lean into', 'showing up for', 'authentic self',
  'safe space', 'hold space', 'sacred container', 'raise your vibration'];

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error('[refresh] ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  // Sort by date ascending (oldest first), take 10
  const sorted = [...articles].sort((a, b) => (a.dateISO || '').localeCompare(b.dateISO || ''));
  const toRefresh = sorted.slice(0, 10);

  console.log(`[refresh] Refreshing ${toRefresh.length} oldest articles`);

  for (const article of toRefresh) {
    // Clean banned words
    let body = article.body || '';
    body = body.replace(/\u2014/g, ' - ');
    body = body.replace(/\u2013/g, ' - ');
    
    for (const word of BANNED_WORDS) {
      const regex = new RegExp(word, 'gi');
      if (regex.test(body)) {
        body = body.replace(regex, match => {
          if (match.toLowerCase() === 'profound') return 'significant';
          if (match.toLowerCase() === 'transformative') return 'meaningful';
          if (match.toLowerCase() === 'holistic') return 'whole-person';
          if (match.toLowerCase() === 'nuanced') return 'layered';
          if (match.toLowerCase() === 'multifaceted') return 'complex';
          return '';
        });
      }
    }
    
    // Update the article body
    const idx = articles.findIndex(a => a.id === article.id);
    if (idx >= 0) {
      articles[idx].body = body;
      articles[idx].lastRefreshed = new Date().toISOString().split('T')[0];
    }
    
    console.log(`[refresh] Cleaned article ${article.id}: ${article.title}`);
  }

  writeFileSync(articlesPath, JSON.stringify(articles));
  console.log('[refresh] Saved updated articles');

  // Push to GitHub
  if (GH_PAT) {
    try {
      const { execSync } = await import('child_process');
      execSync(`cd ${ROOT} && git add content/ && git commit -m "30-day content refresh: ${toRefresh.length} articles" && git push`, {
        stdio: 'inherit',
        env: { ...process.env, GIT_AUTHOR_NAME: EDITORIAL_NAME, GIT_COMMITTER_NAME: EDITORIAL_NAME }
      });
    } catch (e) {
      console.error('[refresh] Git push failed:', e.message);
    }
  }
}

main().catch(err => {
  console.error('[refresh] Fatal error:', err);
  process.exit(1);
});
