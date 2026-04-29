import { countAmazonLinks, extractAsinsFromText } from './amazon-verify.mjs';

// ─── BANNED WORDS: truly AI-flagged, not normal English ───
const AI_FLAGGED_WORDS = [
  'delve', 'tapestry', 'paradigm', 'synergy', 'leverage', 'empower',
  'utilize', 'pivotal', 'embark', 'underscore', 'paramount', 'seamlessly',
  'beacon', 'foster', 'curate', 'curated', 'bespoke',
  'harness', 'plethora', 'myriad',
  'transformative', 'groundbreaking', 'cutting-edge', 'revolutionary',
  'state-of-the-art', 'ever-evolving',
  'multifaceted', 'stakeholders', 'ecosystem',
  'streamline', 'catalyze',
  'unveil', 'unravel', 'demystify',
  'elucidate', 'spearhead', 'orchestrate',
  'underpinning', 'overarching', 'interplay',
  'juxtaposition', 'dichotomy', 'amalgamation', 'confluence'
];

// ─── BANNED PHRASES ───
const AI_FLAGGED_PHRASES = [
  "it's important to note", "in conclusion", "in summary",
  "in the realm of", "dive deep into", "at the end of the day",
  "in today's fast-paced world", "plays a crucial role",
  "a testament to", "when it comes to", "cannot be overstated",
  "it is worth noting", "needless to say", "without further ado",
  "it goes without saying",
  "serves as a reminder", "paves the way",
  "stands as a testament", "offers a glimpse"
];

function voiceSignals(text) {
  const contractions = (text.match(/\b(you're|don't|it's|that's|i've|we'll|won't|can't|isn't|aren't|doesn't|didn't|wouldn't|couldn't|shouldn't|they're|we're|i'm|he's|she's|there's|here's|what's|who's|let's)\b/gi) || []).length;
  const directAddress = (text.match(/\byou(?:r|'re|'ll|'ve)?\b/gi) || []).length;
  const firstPerson = (text.match(/\b(?:I|my|me|I'm|I've|I'd|I'll)\b/g) || []).length;

  const sentences = text.replace(/<[^>]+>/g, '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (lengths.length || 1);
  const sentenceStdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const shortSentences = lengths.filter(l => l <= 6).length;

  const markers = [
    "here's the thing", "honestly", "look,", "truth is",
    "but here's what's interesting", "think about it", "that said",
    "right?", "know what i mean", "how does that make you feel",
    "here's what i've noticed", "and that matters", "stay with me",
    "let me put it this way", "funny thing is", "real talk",
    "here's the kicker", "i'll be honest", "you know what",
    "let that sink in", "pause for a second", "bear with me"
  ];
  const conversationalMarkers = markers.reduce((count, m) => count + (text.toLowerCase().includes(m) ? 1 : 0), 0);

  return { contractions, directAddress, firstPerson, sentenceStdDev, shortSentences, conversationalMarkers };
}

export function runQualityGate(body) {
  const failures = [];
  const warnings = [];

  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).length;

  // Word count: 1200-2500
  if (words < 1200) failures.push(`words-too-low:${words}`);
  if (words > 2500) failures.push(`words-too-high:${words}`);

  // Em-dash: zero allowed
  const hasEmDash = body.includes('\u2014') || body.includes('&mdash;');
  if (hasEmDash) failures.push('contains-em-dash');

  // AI-flagged words
  const lower = text.toLowerCase();
  for (const word of AI_FLAGGED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/-/g, '[-\\s]')}\\b`, 'i');
    if (re.test(lower)) failures.push(`ai-word:${word}`);
  }

  // AI-flagged phrases
  for (const phrase of AI_FLAGGED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) failures.push(`ai-phrase:${phrase}`);
  }

  // Amazon links: minimum 3
  const links = countAmazonLinks(body);
  if (links < 3) failures.push(`amazon-links-too-few:${links}`);

  // Voice signals
  const voice = voiceSignals(text);

  if (voice.contractions < 3) {
    warnings.push(`contractions-low:${voice.contractions}`);
  }

  if (voice.directAddress === 0 && voice.firstPerson === 0) {
    failures.push('no-direct-address-or-first-person');
  }

  if (voice.sentenceStdDev < 3) {
    failures.push(`sentence-variance-too-low:${voice.sentenceStdDev}`);
  }

  if (voice.shortSentences < 2) {
    failures.push(`too-few-short-sentences:${voice.shortSentences}`);
  }

  if (voice.conversationalMarkers < 1) {
    warnings.push(`conversational-markers-low:${voice.conversationalMarkers}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    wordCount: words,
    amazonLinks: links,
    asins: extractAsinsFromText(body),
    voice
  };
}
