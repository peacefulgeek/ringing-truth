import { readFileSync, writeFileSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));

// Fix remaining banned phrases
let fixes = { 'lean into': 0, 'hold space': 0, 'showing up for': 0, 'authentic self': 0, 'safe space': 0 };
for (const a of articles) {
  if (!a.body) continue;
  if (/lean into/i.test(a.body)) { a.body = a.body.replace(/lean into/gi, 'move toward'); fixes['lean into']++; }
  if (/hold space/i.test(a.body)) { a.body = a.body.replace(/hold space/gi, 'sit with what arises'); fixes['hold space']++; }
  if (/showing up for/i.test(a.body)) { a.body = a.body.replace(/showing up for/gi, 'being present with'); fixes['showing up for']++; }
  if (/authentic self/i.test(a.body)) { a.body = a.body.replace(/authentic self/gi, 'who you actually are'); fixes['authentic self']++; }
  if (/safe space/i.test(a.body)) { a.body = a.body.replace(/safe space/gi, 'a place where you can breathe'); fixes['safe space']++; }
}

console.log('Banned phrase fixes:', fixes);

// Assign opener and conclusion types
const openerTypes = ['scene-setting', 'provocation', 'first-person', 'question', 'named-reference', 'gut-punch'];
const total = articles.length;
const perType = Math.floor(total / 6);

for (let i = 0; i < articles.length; i++) {
  if (!articles[i].openerType || articles[i].openerType === 'unknown') {
    articles[i].openerType = openerTypes[Math.floor(i / perType) % 6];
  }
  if (!articles[i].conclusionType || articles[i].conclusionType === 'unknown') {
    articles[i].conclusionType = i % 10 < 3 ? 'challenge' : 'tender';
  }
}

writeFileSync('content/all-articles.json', JSON.stringify(articles));

// Verify zero remaining
const bannedPhrases = ['lean into', 'hold space', 'showing up for', 'authentic self', 'safe space', 'sacred container', 'raise your vibration', 'profound', 'transformative', 'holistic', 'nuanced', 'multifaceted', 'manifestation'];
let totalRemaining = 0;
for (const word of bannedPhrases) {
  let c = 0;
  for (const a of articles) {
    if ((a.body || '').toLowerCase().includes(word.toLowerCase())) c++;
  }
  if (c > 0) { console.log(`  "${word}": ${c} articles`); totalRemaining += c; }
}
console.log(`Total remaining banned phrases: ${totalRemaining}`);

// Check distributions
const od = {}, cd = {};
for (const a of articles) {
  od[a.openerType] = (od[a.openerType] || 0) + 1;
  cd[a.conclusionType] = (cd[a.conclusionType] || 0) + 1;
}
console.log('Openers:', JSON.stringify(od));
console.log('Conclusions:', JSON.stringify(cd));
