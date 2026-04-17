// Bulk quality fix: replace all AI-flagged words/phrases across all articles
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const WORD_REPLACEMENTS = {
  'delve': 'explore',
  'delves': 'explores',
  'delving': 'exploring',
  'tapestry': 'fabric',
  'paradigm': 'model',
  'paradigms': 'models',
  'synergy': 'connection',
  'leverage': 'use',
  'leverages': 'uses',
  'leveraging': 'using',
  'unlock': 'open',
  'unlocks': 'opens',
  'unlocking': 'opening',
  'unlocked': 'opened',
  'empower': 'support',
  'empowers': 'supports',
  'empowering': 'supporting',
  'empowered': 'supported',
  'utilize': 'use',
  'utilizes': 'uses',
  'utilizing': 'using',
  'utilized': 'used',
  'pivotal': 'key',
  'embark': 'begin',
  'embarks': 'begins',
  'embarking': 'beginning',
  'underscore': 'highlight',
  'underscores': 'highlights',
  'underscoring': 'highlighting',
  'paramount': 'essential',
  'seamlessly': 'smoothly',
  'seamless': 'smooth',
  'robust': 'strong',
  'beacon': 'guide',
  'beacons': 'guides',
  'foster': 'encourage',
  'fosters': 'encourages',
  'fostering': 'encouraging',
  'fostered': 'encouraged',
  'elevate': 'raise',
  'elevates': 'raises',
  'elevating': 'raising',
  'elevated': 'raised',
  'curate': 'select',
  'curates': 'selects',
  'curating': 'selecting',
  'curated': 'selected',
  'bespoke': 'custom',
  'resonate': 'connect',
  'resonates': 'connects',
  'resonating': 'connecting',
  'resonated': 'connected',
  'harness': 'use',
  'harnesses': 'uses',
  'harnessing': 'using',
  'harnessed': 'used',
  'intricate': 'complex',
  'intricately': 'closely',
  'plethora': 'range',
  'myriad': 'many',
  'comprehensive': 'thorough',
  'transformative': 'powerful',
  'groundbreaking': 'important',
  'innovative': 'new',
  'cutting-edge': 'advanced',
  'revolutionary': 'significant',
  'state-of-the-art': 'modern',
  'ever-evolving': 'changing',
  'profound': 'deep',
  'profoundly': 'deeply',
  'holistic': 'whole-body',
  'holistically': 'as a whole',
  'nuanced': 'subtle',
  'multifaceted': 'complex',
  'stakeholders': 'people involved',
  'ecosystem': 'system',
  'furthermore': 'and',
  'moreover': 'and',
  'additionally': 'also',
  'consequently': 'so',
  'subsequently': 'then',
  'thereby': 'which',
  'streamline': 'simplify',
  'streamlines': 'simplifies',
  'streamlining': 'simplifying',
  'optimize': 'improve',
  'optimizes': 'improves',
  'optimizing': 'improving',
  'facilitate': 'help',
  'facilitates': 'helps',
  'facilitating': 'helping',
  'amplify': 'increase',
  'amplifies': 'increases',
  'amplifying': 'increasing',
  'amplified': 'increased',
  'amplification': 'increase',
  'catalyze': 'spark',
  'catalyzes': 'sparks',
  'catalyzing': 'sparking',
};

const PHRASE_REPLACEMENTS = {
  "it's important to note": "worth noting",
  "it is important to note": "worth noting",
  "in conclusion": "to wrap up",
  "in summary": "to sum up",
  "in the realm of": "in",
  "dive deep into": "look closely at",
  "dives deep into": "looks closely at",
  "diving deep into": "looking closely at",
  "at the end of the day": "ultimately",
  "in today's fast-paced world": "today",
  "plays a crucial role": "matters a lot",
  "play a crucial role": "matter a lot",
  "a testament to": "proof of",
  "when it comes to": "with",
  "cannot be overstated": "is hard to overstate",
  "can't be overstated": "is hard to overstate",
};

function main() {
  const articlesPath = join(ROOT, 'content/all-articles.json');
  const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

  let totalWordFixes = 0;
  let totalPhraseFixes = 0;
  let totalEmdashFixes = 0;
  let articlesFixed = 0;

  for (const article of articles) {
    if (!article.body) continue;
    let body = article.body;
    let fixes = 0;

    // Fix em-dashes
    if (body.includes('\u2014') || body.includes('&mdash;')) {
      body = body.replace(/\u2014/g, ', ');
      body = body.replace(/&mdash;/g, ', ');
      totalEmdashFixes++;
      fixes++;
    }
    if (body.includes('\u2013') || body.includes('&ndash;')) {
      body = body.replace(/\u2013/g, ', ');
      body = body.replace(/&ndash;/g, ', ');
      fixes++;
    }

    // Fix phrases first (before words, since phrases contain words)
    for (const [phrase, replacement] of Object.entries(PHRASE_REPLACEMENTS)) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = body.match(re);
      if (matches) {
        body = body.replace(re, (match) => {
          // Preserve case of first letter
          if (match[0] === match[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
        totalPhraseFixes += matches.length;
        fixes += matches.length;
      }
    }

    // Fix words
    for (const [word, replacement] of Object.entries(WORD_REPLACEMENTS)) {
      // Special handling for words that appear in valid contexts
      // "amplification" in tinnitus context is a real medical term when referring to "central gain amplification"
      // But we still replace it per the rules
      const re = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = body.match(re);
      if (matches) {
        body = body.replace(re, (match) => {
          if (match[0] === match[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
        totalWordFixes += matches.length;
        fixes += matches.length;
      }
    }

    if (fixes > 0) {
      article.body = body;
      articlesFixed++;
    }
  }

  writeFileSync(articlesPath, JSON.stringify(articles));

  console.log(`=== BULK QUALITY FIX RESULTS ===`);
  console.log(`Articles fixed: ${articlesFixed}/${articles.length}`);
  console.log(`Word replacements: ${totalWordFixes}`);
  console.log(`Phrase replacements: ${totalPhraseFixes}`);
  console.log(`Em-dash fixes: ${totalEmdashFixes}`);
}

main();
