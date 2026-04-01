import { readFileSync } from 'fs';
const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
let placeholderFAQ = 0;
let goodFAQ = 0;
let noFAQ = 0;
articles.forEach(a => {
  if (!a.faqs || a.faqs.length === 0) { noFAQ++; return; }
  const first = a.faqs[0];
  if (!first || !first.question) { noFAQ++; return; }
  if (first.question.includes('Generated FAQ')) { placeholderFAQ++; }
  else { goodFAQ++; }
});
console.log('Placeholder FAQ:', placeholderFAQ);
console.log('Good FAQ:', goodFAQ);
console.log('No FAQ:', noFAQ);
console.log('Total:', articles.length);
