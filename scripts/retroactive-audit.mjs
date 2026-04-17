// Retroactive quality audit: runs quality gate on all articles and reports failures
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function main() {
  const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');

  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  console.log(`Auditing ${articles.length} articles...\n`);

  let passed = 0;
  let failed = 0;
  const failureDetails = [];
  const failureCounts = {};

  for (const article of articles) {
    const gate = runQualityGate(article.body || '');
    if (gate.passed) {
      passed++;
    } else {
      failed++;
      failureDetails.push({
        id: article.id,
        title: article.title,
        wordCount: gate.wordCount,
        amazonLinks: gate.amazonLinks,
        failures: gate.failures,
        warnings: gate.warnings
      });
      for (const f of gate.failures) {
        const key = f.split(':')[0];
        failureCounts[key] = (failureCounts[key] || 0) + 1;
      }
    }
  }

  console.log(`=== QUALITY AUDIT RESULTS ===`);
  console.log(`Total: ${articles.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`\n=== FAILURE BREAKDOWN ===`);
  for (const [key, count] of Object.entries(failureCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }

  if (failureDetails.length > 0) {
    console.log(`\n=== FIRST 20 FAILURES ===`);
    for (const f of failureDetails.slice(0, 20)) {
      console.log(`  #${f.id} "${f.title}" (${f.wordCount}w, ${f.amazonLinks} links): ${f.failures.join(', ')}`);
    }
  }

  // Save full report
  writeFileSync(join(ROOT, 'content/quality-audit.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    total: articles.length,
    passed,
    failed,
    failureCounts,
    failureDetails
  }, null, 2));

  console.log(`\nFull report saved to content/quality-audit.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
