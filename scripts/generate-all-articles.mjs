#!/usr/bin/env node
/**
 * Generate all 300 articles for The Ringing Truth
 * Writes JSON files to /content/ directory
 * Follows Gold Standard: varied openers, FAQ distribution, Kalesh voice, etc.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
const CONTENT_DIR = join(process.cwd(), 'content');
if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

// ─── SITE CONFIG ───
const SITE_NAME = "The Ringing Truth";
const AUTHOR_NAME = "Kalesh";
const AUTHOR_TITLE = "Consciousness Teacher & Writer";
const AUTHOR_LINK = "https://kalesh.love";
const EDITORIAL_NAME = "The Ringing Truth Editorial";
const BUNNY_CDN_BASE = "https://ringing-truth.b-cdn.net";

const CATEGORIES = [
  { slug: "the-science", name: "The Science" },
  { slug: "the-management", name: "The Management" },
  { slug: "the-mind", name: "The Mind" },
  { slug: "the-body", name: "The Body" },
  { slug: "the-deeper-listening", name: "The Deeper Listening" },
];

// ─── EXTERNAL AUTHORITY SITES ───
const EXTERNAL_AUTHORITY_SITES = [
  "https://www.ata.org",
  "https://www.ncbi.nlm.nih.gov",
  "https://www.mayoclinic.org",
  "https://www.nidcd.nih.gov",
  "https://www.asha.org",
  "https://www.health.harvard.edu",
  "https://pubmed.ncbi.nlm.nih.gov",
  "https://www.bta.org.uk",
];

// ─── NICHE RESEARCHERS (70%) ───
const NICHE_RESEARCHERS = [
  "Pawel Jastreboff",
  "David Baguley",
  "Richard Hallam",
  "Laurence McKenna",
  "Josef Rauschecker",
  "Susan Shore",
  "Hubert Lim",
];

// ─── SPIRITUAL RESEARCHERS (30%) — Kalesh's ───
const SPIRITUAL_RESEARCHERS = [
  "Jiddu Krishnamurti",
  "Alan Watts",
  "Sam Harris",
  "Sadhguru",
  "Tara Brach",
];

// ─── KALESH VOICE PHRASES (50) ───
const KALESH_PHRASES = [
  "The mind is not the enemy. The identification with it is.",
  "Most of what passes for healing is just rearranging the furniture in a burning house.",
  "Awareness doesn't need to be cultivated. It needs to be uncovered.",
  "The nervous system doesn't respond to what you believe. It responds to what it senses.",
  "You cannot think your way into a felt sense of safety. The body has its own logic.",
  "Every resistance is information. The question is whether you're willing to read it.",
  "What we call 'stuck' is usually the body doing exactly what it was designed to do under conditions that no longer exist.",
  "The gap between stimulus and response is where your entire life lives.",
  "Consciousness doesn't arrive. It's what's left when everything else quiets down.",
  "The brain is prediction machinery. Anxiety is just prediction running without a stop button.",
  "There is no version of growth that doesn't involve the dissolution of something you thought was permanent.",
  "Trauma reorganizes perception. Recovery reorganizes it again, but this time with your participation.",
  "The contemplative traditions all point to the same thing: what you're looking for is what's looking.",
  "Embodiment is not a technique. It's what happens when you stop living exclusively in your head.",
  "The space between knowing something intellectually and knowing it in your body is where all the real work happens.",
  "Most people don't fear change. They fear the gap between who they were and who they haven't become yet.",
  "Attention is the most undervalued resource you have. Everything else follows from where you place it.",
  "The question is never whether the pain will come. The question is whether you'll meet it with presence or with narrative.",
  "Sit with it long enough and even the worst feeling reveals its edges.",
  "There's a difference between being alone and being with yourself. One is circumstance. The other is practice.",
  "Silence is not the absence of noise. It's the presence of attention.",
  "The breath doesn't need your management. It needs your companionship.",
  "When you stop trying to fix the moment, something remarkable happens — the moment becomes workable.",
  "We are not our thoughts, but we are responsible for our relationship to them.",
  "The body remembers what the mind would prefer to file away.",
  "Patience is not passive. It's the active practice of allowing something to unfold at its own pace.",
  "The paradox of acceptance is that nothing changes until you stop demanding that it does.",
  "What if the restlessness isn't a problem to solve but a signal to follow?",
  "You don't arrive at peace. You stop walking away from it.",
  "The most sophisticated defense mechanism is the one that looks like wisdom.",
  "Stillness is not something you achieve. It's what's already here beneath the achieving.",
  "Every moment of genuine attention is a small act of liberation.",
  "Information without integration is just intellectual hoarding.",
  "Your nervous system doesn't care about your philosophy. It cares about what happened at three years old.",
  "Reading about meditation is to meditation what reading the menu is to eating.",
  "Not every insight requires action. Some just need to be witnessed.",
  "The wellness industry sells solutions to problems it helps you believe you have.",
  "Complexity is the ego's favorite hiding place.",
  "If your spiritual practice makes you more rigid, it's not working.",
  "The research is clear on this, and it contradicts almost everything popular culture teaches.",
  "There's a meaningful difference between self-improvement and self-understanding. One adds. The other reveals.",
  "The algorithm of your attention determines the landscape of your experience.",
  "Stop pathologizing normal human suffering. Not everything requires a diagnosis.",
  "The body has a grammar. Most of us never learned to read it.",
  "You are not a problem to be solved. You are a process to be witnessed.",
  "Freedom is not the absence of constraint. It's the capacity to choose your relationship to it.",
  "The self you're trying to improve is the same self doing the improving. Notice the circularity.",
  "What we call 'the present moment' is not a place you go. It's the only place you've ever been.",
  "The most important things in life cannot be understood — only experienced.",
  "At a certain depth of inquiry, the distinction between psychology and philosophy dissolves entirely.",
];

// ─── OPENER TYPES ───
const OPENER_TYPES = ["scene-setting", "provocation", "first-person", "question", "named-reference", "gut-punch"];

// ─── FAQ DISTRIBUTION: 10% zero, 30% two, 30% three, 20% four, 10% five ───
function assignFaqCounts(total) {
  const counts = [];
  const dist = [
    { count: 0, pct: 0.10 },
    { count: 2, pct: 0.30 },
    { count: 3, pct: 0.30 },
    { count: 4, pct: 0.20 },
    { count: 5, pct: 0.10 },
  ];
  for (const d of dist) {
    const n = Math.round(total * d.pct);
    for (let i = 0; i < n; i++) counts.push(d.count);
  }
  while (counts.length < total) counts.push(3);
  while (counts.length > total) counts.pop();
  // Shuffle
  for (let i = counts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [counts[i], counts[j]] = [counts[j], counts[i]];
  }
  return counts;
}

// ─── BACKLINK DISTRIBUTION: 23% kalesh.love, 42% external, 35% internal ───
function assignBacklinkTypes(total) {
  const types = [];
  const kaleshCount = Math.round(total * 0.23);
  const externalCount = Math.round(total * 0.42);
  const internalCount = total - kaleshCount - externalCount;
  for (let i = 0; i < kaleshCount; i++) types.push("kalesh");
  for (let i = 0; i < externalCount; i++) types.push("external");
  for (let i = 0; i < internalCount; i++) types.push("internal");
  // Shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

// ─── DATE DISTRIBUTION ───
function generateDates(total) {
  const dates = [];
  // 30 articles: Jan 1 - Mar 27, 2026 (backdated, ~1 every 2.8 days)
  const launchStart = new Date('2026-01-01T10:00:00Z');
  const launchEnd = new Date('2026-03-27T10:00:00Z');
  const launchSpan = launchEnd.getTime() - launchStart.getTime();
  for (let i = 0; i < 30; i++) {
    const t = launchStart.getTime() + (launchSpan * i / 29);
    dates.push(new Date(t));
  }
  // 270 articles: future dates at 5/day starting Mar 28
  const futureStart = new Date('2026-03-28T10:00:00Z');
  for (let i = 0; i < 270; i++) {
    const dayOffset = Math.floor(i / 5);
    const d = new Date(futureStart.getTime() + dayOffset * 86400000);
    dates.push(d);
  }
  return dates;
}

// ─── ARTICLE TOPICS ───
// 60 per category = 300 total
const ARTICLE_TOPICS = {
  "the-science": [
    "How Tinnitus Rewires Your Brain Over Time",
    "The Neuroscience Behind Phantom Sound Perception",
    "Why Your Brain Creates Sound That Isn't There",
    "Auditory Cortex Plasticity and Tinnitus Formation",
    "The Role of the Limbic System in Tinnitus Distress",
    "Neuroimaging Studies That Changed Tinnitus Understanding",
    "How Hearing Loss Triggers Central Gain in the Brain",
    "The Tonotopic Map and What Happens When It Breaks",
    "Somatosensory Tinnitus and the Jaw Connection",
    "Why Tinnitus Is a Brain Problem Not an Ear Problem",
    "The Dorsal Cochlear Nucleus and Signal Amplification",
    "How Stress Hormones Amplify Tinnitus Perception",
    "The Default Mode Network and Tinnitus Awareness",
    "Glutamate Excitotoxicity in Tinnitus Development",
    "GABA Deficiency and Its Role in Persistent Ringing",
    "The Inferior Colliculus and Auditory Processing Errors",
    "How Age-Related Hearing Changes Lead to Tinnitus",
    "Noise-Induced Cochlear Damage at the Cellular Level",
    "The Stria Vascularis and Inner Ear Blood Supply",
    "Otoacoustic Emissions and What They Reveal About Tinnitus",
    "Hair Cell Damage and the Point of No Return",
    "The Auditory Nerve and Signal Transmission Failures",
    "How Medications Can Trigger or Worsen Tinnitus",
    "Ototoxic Drugs and Their Impact on Hearing Cells",
    "The Genetics of Tinnitus Susceptibility",
    "Twin Studies and What They Tell Us About Tinnitus Risk",
    "Inflammation and Its Hidden Role in Tinnitus",
    "The Blood-Labyrinth Barrier and Inner Ear Protection",
    "How Cardiovascular Health Affects Tinnitus Severity",
    "Pulsatile Tinnitus and Vascular Abnormalities",
    "The Tensor Tympani Muscle and Middle Ear Myoclonus",
    "Eustachian Tube Dysfunction and Perceived Sound Changes",
    "How TMJ Disorders Create and Amplify Tinnitus",
    "The Trigeminal Nerve Pathway to Tinnitus",
    "Cervicogenic Tinnitus and Neck-Related Sound Perception",
    "How Concussions and Head Injuries Cause Tinnitus",
    "The Vestibular System and Its Connection to Ringing",
    "Meniere's Disease and the Tinnitus Component",
    "Acoustic Neuroma and Unilateral Tinnitus Signals",
    "How COVID-19 Affects the Auditory System",
    "Long COVID and New-Onset Tinnitus Research",
    "The Microbiome-Gut-Brain-Ear Axis Hypothesis",
    "Oxidative Stress and Free Radical Damage in the Cochlea",
    "How Sleep Deprivation Intensifies Tinnitus Perception",
    "The Circadian Rhythm and Tinnitus Fluctuation Patterns",
    "Hormonal Changes and Tinnitus in Women",
    "Pregnancy-Related Tinnitus and What Causes It",
    "The Thyroid Connection to Tinnitus Symptoms",
    "Diabetes and Its Impact on Auditory Function",
    "Iron Deficiency Anemia and Tinnitus Correlation",
    "How Caffeine Actually Affects Tinnitus Research Says",
    "Alcohol and Tinnitus the Complex Relationship",
    "Nicotine and Cochlear Blood Flow Restriction",
    "The Placebo Effect in Tinnitus Treatment Trials",
    "Why Most Tinnitus Supplements Fail Clinical Testing",
    "The Current State of Tinnitus Drug Development",
    "Gene Therapy Approaches for Hair Cell Regeneration",
    "Stem Cell Research and Future Hearing Restoration",
    "Bimodal Neuromodulation and the Susan Shore Device",
    "The Future of Tinnitus Treatment What Science Promises",
  ],
  "the-management": [
    "Sound Therapy Fundamentals for Tinnitus Relief",
    "White Noise vs Pink Noise vs Brown Noise for Tinnitus",
    "How to Build a Personal Sound Therapy Routine",
    "Notched Sound Therapy and Frequency-Specific Relief",
    "Tinnitus Retraining Therapy What to Actually Expect",
    "The Jastreboff Model Explained in Plain Language",
    "How Hearing Aids Help Even When You Think You Hear Fine",
    "Open-Fit vs Closed-Fit Hearing Aids for Tinnitus",
    "Cochlear Implants and Tinnitus Reduction Evidence",
    "Bone Conduction Devices for Tinnitus Management",
    "How to Choose the Right Audiologist for Tinnitus",
    "What a Comprehensive Tinnitus Evaluation Looks Like",
    "The Role of an ENT in Your Tinnitus Journey",
    "When to Seek Emergency Care for Sudden Tinnitus",
    "Masking Devices and How to Use Them Effectively",
    "Nature Sounds That Actually Help with Tinnitus",
    "Music Therapy Approaches for Tinnitus Habituation",
    "How to Sleep When the Ringing Won't Stop",
    "Pillow Speakers and Bedside Sound Machines Compared",
    "Creating a Tinnitus-Friendly Bedroom Environment",
    "Tinnitus and Workplace Accommodations You Deserve",
    "How to Protect Your Hearing Without Increasing Tinnitus",
    "Custom Earplugs vs Foam Plugs for Tinnitus Sufferers",
    "Managing Tinnitus Spikes After Noise Exposure",
    "The Habituation Timeline What Research Actually Shows",
    "Why Some People Habituate Quickly and Others Don't",
    "Diet Changes That May Influence Tinnitus Severity",
    "The Low-Sodium Approach to Tinnitus Management",
    "Anti-Inflammatory Foods and Their Effect on Tinnitus",
    "Supplements That Have Actual Evidence for Tinnitus",
    "Magnesium and Tinnitus the Research Summary",
    "Zinc Supplementation and Hearing Health Evidence",
    "NAC and Antioxidant Protection for the Inner Ear",
    "Melatonin for Tinnitus-Related Sleep Disruption",
    "Ginkgo Biloba for Tinnitus What Studies Really Show",
    "How to Track Your Tinnitus Patterns Effectively",
    "Building a Tinnitus Management Plan That Actually Works",
    "The First 90 Days After Tinnitus Onset What to Do",
    "Long-Term Tinnitus Management Beyond the First Year",
    "How to Talk to Your Doctor About Tinnitus",
    "Navigating Insurance Coverage for Tinnitus Treatment",
    "Telehealth Options for Tinnitus Support",
    "Tinnitus Apps That Actually Help Based on Evidence",
    "How to Evaluate Tinnitus Treatment Claims",
    "Red Flags in Tinnitus Cure Marketing",
    "The Cost of Tinnitus Treatment What to Budget For",
    "Support Groups and Community Resources for Tinnitus",
    "How to Explain Tinnitus to People Who Don't Have It",
    "Tinnitus and Relationships Navigating the Impact Together",
    "Parenting with Tinnitus Practical Strategies",
    "Traveling with Tinnitus Air Pressure and Altitude",
    "Exercise Guidelines for People with Tinnitus",
    "Swimming and Water Sports with Tinnitus Considerations",
    "Concerts and Live Music with Tinnitus a Practical Guide",
    "How to Handle Tinnitus Setbacks Without Spiraling",
    "The Role of Routine in Tinnitus Management",
    "Seasonal Changes and Tinnitus Fluctuation",
    "Managing Multiple Health Conditions Alongside Tinnitus",
    "When Tinnitus Changes Character What It Means",
    "Building Resilience Through Tinnitus Management",
  ],
  "the-mind": [
    "The Anxiety-Tinnitus Feedback Loop and How to Break It",
    "CBT for Tinnitus What the Evidence Actually Shows",
    "Acceptance and Commitment Therapy for Tinnitus Distress",
    "How Catastrophic Thinking Amplifies Tinnitus Suffering",
    "The Role of Attention in Tinnitus Perception",
    "Mindfulness-Based Tinnitus Stress Reduction",
    "How Fear Conditioning Maintains Tinnitus Distress",
    "The Amygdala Hijack and Why Tinnitus Feels Threatening",
    "Cognitive Distortions Common in Tinnitus Sufferers",
    "How to Challenge Tinnitus-Related Thought Patterns",
    "The Hypervigilance Trap and Tinnitus Monitoring",
    "Why Checking Your Tinnitus Makes It Louder",
    "Depression and Tinnitus the Bidirectional Relationship",
    "Suicidal Ideation and Tinnitus When to Get Help Now",
    "PTSD and Tinnitus the Trauma-Sound Connection",
    "How Childhood Experiences Shape Tinnitus Response",
    "The Grief Process in Chronic Tinnitus Adjustment",
    "Anger and Tinnitus Processing the Unfairness",
    "How Perfectionism Worsens Tinnitus Coping",
    "The Control Paradox in Tinnitus Management",
    "Learned Helplessness and How to Overcome It with Tinnitus",
    "How Social Isolation Amplifies Tinnitus Distress",
    "The Nocebo Effect and Tinnitus Online Forums",
    "How Reading Horror Stories About Tinnitus Hurts You",
    "Building Psychological Flexibility Around Tinnitus",
    "Values-Based Living When Tinnitus Tries to Shrink Your World",
    "The Difference Between Coping and Thriving with Tinnitus",
    "How Meaning-Making Transforms the Tinnitus Experience",
    "Neuroplasticity and Rewiring Your Response to Tinnitus",
    "The Power of Defusion Techniques for Tinnitus Thoughts",
    "How to Stop Fighting Your Tinnitus and Start Living",
    "Emotional Regulation Skills for Tinnitus Distress",
    "The Window of Tolerance and Tinnitus Reactivity",
    "How Journaling Helps Process Tinnitus Emotions",
    "Visualization Techniques for Tinnitus Relief",
    "The Role of Self-Compassion in Tinnitus Recovery",
    "How to Build a Tinnitus-Resilient Mindset",
    "The Relationship Between Burnout and Tinnitus Onset",
    "How Work Stress Feeds the Tinnitus Cycle",
    "Sleep Anxiety and Tinnitus Breaking the Anticipation Loop",
    "How to Meditate When Silence Is Your Trigger",
    "The Paradox of Trying to Relax with Tinnitus",
    "How Tinnitus Changes Your Relationship with Silence",
    "Finding Identity Beyond Being a Tinnitus Sufferer",
    "The Comparison Trap Why Your Tinnitus Journey Is Unique",
    "How to Set Boundaries Around Tinnitus Conversations",
    "The Role of Hope in Tinnitus Recovery Without False Promises",
    "How to Navigate Tinnitus Anniversaries and Triggers",
    "Building Post-Traumatic Growth from Tinnitus Experience",
    "The Psychology of Habituation What Actually Happens",
    "How Memory and Emotion Color Tinnitus Perception",
    "The Spotlight Effect Why Tinnitus Seems Louder When Noticed",
    "How to Develop a Healthy Relationship with Your Tinnitus",
    "The Role of Gratitude Practice in Tinnitus Management",
    "How Creative Expression Helps Process Tinnitus Distress",
    "The Neuroscience of Distraction and Tinnitus Relief",
    "How to Handle Well-Meaning but Harmful Tinnitus Advice",
    "The Stages of Tinnitus Acceptance What to Expect",
    "How to Find a Therapist Who Understands Tinnitus",
    "Building a Mental Health Toolkit for Tinnitus Days",
  ],
  "the-body": [
    "How Your Nervous System Responds to Tinnitus",
    "Polyvagal Theory and the Tinnitus Stress Response",
    "Vagus Nerve Stimulation for Tinnitus What We Know",
    "The Fight-or-Flight Response and Persistent Ringing",
    "How Chronic Stress Keeps Your Tinnitus Activated",
    "Somatic Experiencing Approaches for Tinnitus Distress",
    "Body Scanning Techniques for Tinnitus-Related Tension",
    "How Jaw Tension Amplifies Tinnitus Perception",
    "TMJ Exercises That May Reduce Tinnitus Severity",
    "Neck and Shoulder Release for Cervicogenic Tinnitus",
    "The Breath-Tinnitus Connection Practical Techniques",
    "Diaphragmatic Breathing for Tinnitus Calm",
    "How Yoga Affects Tinnitus Perception and Distress",
    "Tai Chi and Qigong for Tinnitus Management",
    "Progressive Muscle Relaxation for Tinnitus Relief",
    "How Exercise Intensity Affects Tinnitus Levels",
    "Cardiovascular Fitness and Long-Term Tinnitus Outcomes",
    "Strength Training Considerations for Tinnitus Sufferers",
    "How Posture Affects Tinnitus Through Cervical Pathways",
    "The Alexander Technique and Tinnitus Reduction",
    "Craniosacral Therapy for Tinnitus What Evidence Exists",
    "Acupuncture for Tinnitus Research and Reality",
    "Chiropractic Care and Tinnitus Claims vs Evidence",
    "Massage Therapy for Tinnitus-Related Muscle Tension",
    "How Hydration Levels Affect Tinnitus Perception",
    "The Sleep-Body-Tinnitus Triangle",
    "How Fatigue Amplifies Tinnitus Through Neural Pathways",
    "Cold Exposure and Its Effect on Tinnitus",
    "Heat Therapy for Tinnitus-Related Muscle Tension",
    "How Blood Pressure Fluctuations Affect Tinnitus",
    "The Gut-Brain-Ear Connection Emerging Research",
    "Probiotics and Tinnitus the Early Evidence",
    "How Food Sensitivities May Trigger Tinnitus Spikes",
    "Histamine Intolerance and Tinnitus Fluctuation",
    "The Role of Inflammation Markers in Tinnitus Severity",
    "How Dental Health Connects to Tinnitus",
    "Bruxism and Nighttime Tinnitus Amplification",
    "The Eyes-Ears Connection Visual Strain and Tinnitus",
    "How Screen Time Affects Tinnitus Through Multiple Pathways",
    "Biofeedback Training for Tinnitus Self-Regulation",
    "Heart Rate Variability Training and Tinnitus",
    "How to Read Your Body's Tinnitus Warning Signals",
    "The Endocrine System and Tinnitus Fluctuation",
    "Cortisol Patterns and Daily Tinnitus Variation",
    "How Menstrual Cycles Affect Tinnitus in Women",
    "Perimenopause Menopause and Tinnitus Changes",
    "The Autonomic Nervous System and Tinnitus Regulation",
    "How Pain and Tinnitus Share Neural Pathways",
    "Fibromyalgia and Tinnitus the Comorbidity Connection",
    "How Allergies and Sinus Issues Affect Tinnitus",
    "The Immune System Response and Tinnitus Flares",
    "How Weather Changes Affect Tinnitus Perception",
    "Barometric Pressure and Inner Ear Sensitivity",
    "The Role of Vitamin D in Hearing Health",
    "B12 Deficiency and Its Connection to Tinnitus",
    "Omega-3 Fatty Acids and Auditory System Protection",
    "How Fasting Affects Tinnitus Perception",
    "The Lymphatic System and Inner Ear Fluid Balance",
    "How Dehydration Creates Temporary Tinnitus Spikes",
    "Building a Body-Based Tinnitus Management Practice",
  ],
  "the-deeper-listening": [
    "What Tinnitus Teaches About the Nature of Perception",
    "The Spiritual Dimension of Living with Unwanted Sound",
    "How Tinnitus Becomes a Doorway to Present-Moment Awareness",
    "The Ancient Practice of Listening to Inner Sound",
    "Nada Yoga and the Sacred Sound Within",
    "How Contemplative Traditions Understand Inner Hearing",
    "The Paradox of Finding Silence Through Tinnitus",
    "Being With What Is When What Is Won't Stop Ringing",
    "How Tinnitus Strips Away the Illusion of Control",
    "The Invitation Hidden Inside Unwanted Experience",
    "What Resistance to Tinnitus Reveals About Resistance to Life",
    "How Suffering Transforms When You Stop Running from Sound",
    "The Difference Between Pain and Suffering in Tinnitus",
    "How Tinnitus Teaches Radical Acceptance",
    "The Observer and the Observed in Tinnitus Experience",
    "How Awareness Changes Your Relationship with Ringing",
    "Meditation Practices Designed for People with Tinnitus",
    "How to Use Tinnitus as Your Meditation Object",
    "The Breath as Anchor When Sound Cannot Be Escaped",
    "Walking Meditation for Tinnitus-Related Restlessness",
    "How Body-Based Meditation Bypasses Tinnitus Distress",
    "The Practice of Non-Resistance with Chronic Sound",
    "How Equanimity Develops Through Living with Tinnitus",
    "The Neuroscience of Acceptance and Its Effect on Tinnitus",
    "How Compassion Practice Reduces Tinnitus Suffering",
    "Loving-Kindness Meditation Adapted for Tinnitus",
    "How Gratitude Shifts the Tinnitus Experience",
    "The Role of Surrender in Tinnitus Habituation",
    "How Tinnitus Reveals Your Relationship with Impermanence",
    "The Teacher Disguised as a Symptom",
    "How Living with Tinnitus Develops Emotional Maturity",
    "The Connection Between Inner Peace and Outer Sound",
    "How Tinnitus Changes Your Definition of Quiet",
    "Finding Richness in a Life That Includes Ringing",
    "How Other Chronic Conditions Teach Us About Tinnitus Acceptance",
    "The Wisdom Traditions on Living with What Cannot Be Fixed",
    "How Tinnitus Challenges Western Fix-It Mentality",
    "The Eastern Approach to Symptoms as Teachers",
    "How Sound Sensitivity Develops Deeper Listening Skills",
    "The Gift of Forced Presence That Tinnitus Provides",
    "How Tinnitus Survivors Describe Their Transformation",
    "The Relationship Between Meaning and Suffering in Tinnitus",
    "How Purpose Reduces Tinnitus Impact on Quality of Life",
    "The Practice of Allowing Sound Without Adding Story",
    "How to Distinguish Between Tinnitus and Your Reaction to It",
    "The Space Between the Ringing and Your Response",
    "How Mindful Listening Transforms All Sound Experience",
    "The Practice of Deep Listening Beyond Tinnitus",
    "How Tinnitus Opens the Door to Embodied Awareness",
    "The Relationship Between Stillness and Sound",
    "How Night Silence Becomes a Practice Ground",
    "The Art of Resting in Awareness Despite Tinnitus",
    "How Tinnitus Teaches You About Your Own Mind",
    "The Unexpected Freedom in Accepting Permanent Sound",
    "How Community and Shared Experience Heal Tinnitus Isolation",
    "The Practice of Holding Both Grief and Gratitude",
    "How Tinnitus Changes Your Relationship with Music",
    "The Deeper Listening That Tinnitus Makes Possible",
    "What Comes After Acceptance the Next Chapter",
    "How to Live Fully in a World That Always Rings",
  ],
};

// ─── CONCLUSION TYPES: 30% challenge, 70% tender ───
const CONCLUSION_TYPES = [];
for (let i = 0; i < 90; i++) CONCLUSION_TYPES.push("challenge");
for (let i = 0; i < 210; i++) CONCLUSION_TYPES.push("tender");
// Shuffle
for (let i = CONCLUSION_TYPES.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [CONCLUSION_TYPES[i], CONCLUSION_TYPES[j]] = [CONCLUSION_TYPES[j], CONCLUSION_TYPES[i]];
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// Build the full article list with all metadata
function buildArticleList() {
  const articles = [];
  const faqCounts = assignFaqCounts(300);
  const backlinkTypes = assignBacklinkTypes(300);
  const dates = generateDates(300);
  
  // Distribute openers evenly: 50 each type
  const openers = [];
  for (const type of OPENER_TYPES) {
    for (let i = 0; i < 50; i++) openers.push(type);
  }
  // Shuffle
  for (let i = openers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [openers[i], openers[j]] = [openers[j], openers[i]];
  }

  let idx = 0;
  for (const cat of CATEGORIES) {
    const topics = ARTICLE_TOPICS[cat.slug];
    for (let i = 0; i < topics.length; i++) {
      const title = topics[i];
      const slug = slugify(title);
      // Pick 3-5 Kalesh phrases for this article (randomized)
      const phraseCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
      const shuffledPhrases = [...KALESH_PHRASES].sort(() => Math.random() - 0.5);
      const selectedPhrases = shuffledPhrases.slice(0, phraseCount);
      
      // Pick researcher
      const isSpiritual = Math.random() < 0.3;
      const researchers = isSpiritual ? SPIRITUAL_RESEARCHERS : NICHE_RESEARCHERS;
      const researcher = researchers[Math.floor(Math.random() * researchers.length)];
      
      // Pick external authority
      const extSite = EXTERNAL_AUTHORITY_SITES[Math.floor(Math.random() * EXTERNAL_AUTHORITY_SITES.length)];
      
      articles.push({
        id: idx + 1,
        title,
        slug,
        category: cat.slug,
        categoryName: cat.name,
        dateISO: dates[idx].toISOString().split('T')[0],
        faqCount: faqCounts[idx],
        backlinkType: backlinkTypes[idx],
        openerType: openers[idx],
        conclusionType: CONCLUSION_TYPES[idx],
        phrases: selectedPhrases,
        researcher,
        externalSite: extSite,
        isSpiritual,
      });
      idx++;
    }
  }
  return articles;
}

// Export for use by other scripts
const ALL_ARTICLES = buildArticleList();

// Write article metadata
writeFileSync(
  join(CONTENT_DIR, 'articles-meta.json'),
  JSON.stringify(ALL_ARTICLES, null, 2)
);

console.log(`Generated metadata for ${ALL_ARTICLES.length} articles`);
console.log(`FAQ distribution: ${JSON.stringify(countBy(ALL_ARTICLES, 'faqCount'))}`);
console.log(`Backlink distribution: ${JSON.stringify(countBy(ALL_ARTICLES, 'backlinkType'))}`);
console.log(`Opener distribution: ${JSON.stringify(countBy(ALL_ARTICLES, 'openerType'))}`);
console.log(`Conclusion distribution: ${JSON.stringify(countBy(ALL_ARTICLES, 'conclusionType'))}`);

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

export { ALL_ARTICLES, CATEGORIES, KALESH_PHRASES, NICHE_RESEARCHERS, SPIRITUAL_RESEARCHERS, EXTERNAL_AUTHORITY_SITES, BUNNY_CDN_BASE, SITE_NAME, AUTHOR_NAME, AUTHOR_TITLE, AUTHOR_LINK, EDITORIAL_NAME };
