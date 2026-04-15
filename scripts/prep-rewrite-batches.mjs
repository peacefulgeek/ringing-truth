import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const articles = JSON.parse(readFileSync('content/all-articles.json', 'utf8'));
const total = articles.length;

// Assign metadata for each article
// FIX 1: Opener types - distribute evenly across 6 types
const openerTypes = ['scene-setting', 'provocation', 'first-person', 'question', 'named-reference', 'gut-punch'];
// FIX 4: FAQ distribution: 10% zero, 30% two, 30% three, 20% four, 10% five
// FIX 6: Conclusions: 30% challenge, 70% tender
// FIX 9: Voice phrases from Kalesh library (50 phrases)

// Kalesh voice phrases (adapted for tinnitus context)
const kaleshPhrases = [
  // Teaching (1-18)
  `"The mind is not the enemy. The identification with it is."`,
  `"Most of what passes for healing is just rearranging the furniture in a burning house."`,
  `"Awareness doesn't need to be cultivated. It needs to be uncovered."`,
  `"The nervous system doesn't respond to what you believe. It responds to what it senses."`,
  `"You cannot think your way into a felt sense of safety. The body has its own logic."`,
  `"Every resistance is information. The question is whether you're willing to read it."`,
  `"What we call 'stuck' is usually the body doing exactly what it was designed to do under conditions that no longer exist."`,
  `"The gap between stimulus and response is where your entire life lives."`,
  `"Consciousness doesn't arrive. It's what's left when everything else quiets down."`,
  `"The brain is prediction machinery. Anxiety is just prediction running without a stop button."`,
  `"There is no version of growth that doesn't involve the dissolution of something you thought was permanent."`,
  `"Trauma reorganizes perception. Recovery reorganizes it again, but this time with your participation."`,
  `"The contemplative traditions all point to the same thing: what you're looking for is what's looking."`,
  `"Embodiment is not a technique. It's what happens when you stop living exclusively in your head."`,
  `"The space between knowing something intellectually and knowing it in your body is where all the real work happens."`,
  `"Most people don't fear change. They fear the gap between who they were and who they haven't become yet."`,
  `"Attention is the most undervalued resource you have. Everything else follows from where you place it."`,
  `"The question is never whether the pain will come. The question is whether you'll meet it with presence or with narrative."`,
  // Contemplative (19-32)
  `"Sit with it long enough and even the worst feeling reveals its edges."`,
  `"There's a difference between being alone and being with yourself. One is circumstance. The other is practice."`,
  `"Silence is not the absence of noise. It's the presence of attention."`,
  `"The breath doesn't need your management. It needs your companionship."`,
  `"When you stop trying to fix the moment, something remarkable happens - the moment becomes workable."`,
  `"We are not our thoughts, but we are responsible for our relationship to them."`,
  `"The body remembers what the mind would prefer to file away."`,
  `"Patience is not passive. It's the active practice of allowing something to unfold at its own pace."`,
  `"The paradox of acceptance is that nothing changes until you stop demanding that it does."`,
  `"What if the restlessness isn't a problem to solve but a signal to follow?"`,
  `"You don't arrive at peace. You stop walking away from it."`,
  `"The most sophisticated defense mechanism is the one that looks like wisdom."`,
  `"Stillness is not something you achieve. It's what's already here beneath the achieving."`,
  `"Every moment of genuine attention is a small act of liberation."`,
  // Grounded/Direct (33-44)
  `"Information without integration is just intellectual hoarding."`,
  `"Your nervous system doesn't care about your philosophy. It cares about what happened at three years old."`,
  `"Reading about meditation is to meditation what reading the menu is to eating."`,
  `"Not every insight requires action. Some just need to be witnessed."`,
  `"The wellness industry sells solutions to problems it helps you believe you have."`,
  `"Complexity is the ego's favorite hiding place."`,
  `"If your spiritual practice makes you more rigid, it's not working."`,
  `"The research is clear on this, and it contradicts almost everything popular culture teaches."`,
  `"There's a meaningful difference between self-improvement and self-understanding. One adds. The other reveals."`,
  `"The algorithm of your attention determines the landscape of your experience."`,
  `"Stop pathologizing normal human suffering. Not everything requires a diagnosis."`,
  `"The body has a grammar. Most of us never learned to read it."`,
  // Philosophical (45-50)
  `"You are not a problem to be solved. You are a process to be witnessed."`,
  `"Freedom is not the absence of constraint. It's the capacity to choose your relationship to it."`,
  `"The self you're trying to improve is the same self doing the improving. Notice the circularity."`,
  `"What we call 'the present moment' is not a place you go. It's the only place you've ever been."`,
  `"The most important things in life cannot be understood - only experienced."`,
  `"At a certain depth of inquiry, the distinction between psychology and philosophy dissolves entirely."`
];

// Tinnitus-relevant named researchers (adapted from Kalesh profile + tinnitus niche)
const namedResearchers = [
  'Josef Rauschecker (Georgetown neuroscientist, tinnitus brain mapping)',
  'Pawel Jastreboff (TRT creator, neurophysiological model of tinnitus)',
  'Jon Kabat-Zinn (MBSR, mindfulness-based stress reduction)',
  'Stephen Porges (polyvagal theory, nervous system regulation)',
  'Bessel van der Kolk (body keeps the score, trauma and the body)',
  'Peter Levine (somatic experiencing, trauma resolution)',
  'Tara Brach (radical acceptance, RAIN technique)',
  'Sam Harris (secular meditation, neuroscience of consciousness)',
  'Alan Watts (Eastern philosophy for Western minds)',
  'Jiddu Krishnamurti (observation without the observer)',
  'Richard Davidson (neuroscience of meditation, emotional styles)',
  'Aage Moller (tinnitus neurophysiology)',
  'David Baguley (tinnitus and hyperacusis research)',
  'Rilana Cima (CBT for tinnitus)',
  'Berthold Langguth (neuromodulation for tinnitus)',
];

// Conversational interjections (exactly 2 per article)
const interjections = [
  'Stay with me here.',
  'I know, I know.',
  'Wild, right?',
  'Think about that for a second.',
  'Here is what gets interesting.',
  'And this is the part nobody talks about.',
  'Bear with me on this one.',
  'Sounds strange, I realize.',
  'Stick with this for a moment.',
  'Now here is the thing.',
  'Let that land for a second.',
  'I get it. Really, I do.',
  'Hang on, because this matters.',
  'This part surprised me too.',
  'Worth sitting with, that one.',
];

// Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Assign opener types evenly
const shuffledArticles = shuffle([...Array(total).keys()]);
const openerAssignments = {};
const perType = Math.floor(total / 6);
for (let t = 0; t < 6; t++) {
  const start = t * perType;
  const end = t === 5 ? total : (t + 1) * perType;
  for (let i = start; i < end; i++) {
    openerAssignments[shuffledArticles[i]] = openerTypes[t];
  }
}

// Assign FAQ counts: 10% zero, 30% two, 30% three, 20% four, 10% five
const shuffled2 = shuffle([...Array(total).keys()]);
const faqAssignments = {};
const zeroEnd = Math.round(total * 0.10);
const twoEnd = zeroEnd + Math.round(total * 0.30);
const threeEnd = twoEnd + Math.round(total * 0.30);
const fourEnd = threeEnd + Math.round(total * 0.20);
for (let i = 0; i < total; i++) {
  const idx = shuffled2[i];
  if (i < zeroEnd) faqAssignments[idx] = 0;
  else if (i < twoEnd) faqAssignments[idx] = 2;
  else if (i < threeEnd) faqAssignments[idx] = 3;
  else if (i < fourEnd) faqAssignments[idx] = 4;
  else faqAssignments[idx] = 5;
}

// Assign conclusion types: 30% challenge, 70% tender
const shuffled3 = shuffle([...Array(total).keys()]);
const conclusionAssignments = {};
const challengeEnd = Math.round(total * 0.30);
for (let i = 0; i < total; i++) {
  conclusionAssignments[shuffled3[i]] = i < challengeEnd ? 'challenge' : 'tender';
}

// Build batch metadata
const BATCH_SIZE = 5;
mkdirSync('content/rewrite-batches', { recursive: true });

const batches = [];
for (let i = 0; i < total; i += BATCH_SIZE) {
  const batch = articles.slice(i, i + BATCH_SIZE).map((a, j) => {
    const idx = i + j;
    // Pick 3-5 random phrases
    const phraseCount = 3 + Math.floor(Math.random() * 3);
    const selectedPhrases = shuffle(kaleshPhrases).slice(0, phraseCount);
    // Pick 2 interjections
    const selectedInterjections = shuffle(interjections).slice(0, 2);
    // Pick 1-2 researchers
    const researcherCount = 1 + Math.floor(Math.random() * 2);
    const selectedResearchers = shuffle(namedResearchers).slice(0, researcherCount);
    
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      categoryName: a.categoryName,
      openerType: openerAssignments[idx] || 'scene-setting',
      faqCount: faqAssignments[idx] !== undefined ? faqAssignments[idx] : 3,
      conclusionType: conclusionAssignments[idx] || 'tender',
      phrases: selectedPhrases,
      interjections: selectedInterjections,
      researchers: selectedResearchers,
      existingBody: a.body ? a.body.substring(0, 200) : '', // Just first 200 chars for context
    };
  });
  
  const batchIdx = Math.floor(i / BATCH_SIZE);
  const batchFile = `content/rewrite-batches/batch-${batchIdx}.json`;
  writeFileSync(batchFile, JSON.stringify(batch, null, 2));
  batches.push(batchFile);
}

console.log(`Created ${batches.length} rewrite batches for ${total} articles`);

// Verify distributions
const openerDist = {};
const faqDist = {};
const conclusionDist = {};
for (let i = 0; i < total; i++) {
  const o = openerAssignments[i] || 'scene-setting';
  openerDist[o] = (openerDist[o] || 0) + 1;
  const f = faqAssignments[i] !== undefined ? faqAssignments[i] : 3;
  faqDist[f] = (faqDist[f] || 0) + 1;
  const c = conclusionAssignments[i] || 'tender';
  conclusionDist[c] = (conclusionDist[c] || 0) + 1;
}
console.log('Opener distribution:', JSON.stringify(openerDist));
console.log('FAQ distribution:', JSON.stringify(faqDist));
console.log('Conclusion distribution:', JSON.stringify(conclusionDist));
