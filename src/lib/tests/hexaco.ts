// HEXACO short form — six broad personality factors (Ashton & Lee),
// including Honesty-Humility. Original items written for Cosmic Dossier.
import type { TestDef } from "./types";
import { AGREE_5, buildDims, multiDimHelpers, type DimSpec } from "./build";

const DIMS: DimSpec[] = [
  { key: "H", label: "Honesty-Humility", blurb: "Sincerity, fairness and modesty versus self-interest.", archetypes: ["the-harmonizer", "the-warden"],
    low: "You're comfortable working the angles and enjoy status and nice things. That can drive ambition; just watch where strategy shades into manipulation.", mid: "You're generally fair and sincere, with a pragmatic streak when stakes are high.", high: "You're sincere, fair and unimpressed by status. You'd rather lose honestly than win by bending the rules.",
    items: ["I wouldn't flatter someone just to get ahead.", "-I'd be tempted to keep extra change a cashier gave me by mistake.", "-Having expensive things matters to me.", "I think I'm an ordinary person, no better than others."] },
  { key: "E", label: "Emotionality", blurb: "Anxiety, sentimentality and need for support.", archetypes: ["the-empath", "the-observer"],
    low: "You're emotionally steady and self-reliant, rarely anxious about danger. Others may read this as detachment.", mid: "You feel worry and attachment in normal measure and lean on others when it really counts.", high: "You feel deeply, worry readily and bond strongly. Sharing the load with trusted people is a strength, not a weakness.",
    items: ["I worry about things more than most people.", "I feel strong emotions when saying goodbye.", "-I rarely need others to comfort me.", "Physical danger makes me very nervous."] },
  { key: "X", label: "eXtraversion", blurb: "Social confidence, liveliness and boldness.", archetypes: ["the-firestarter", "the-visionary"],
    low: "You prefer quieter settings and smaller groups, and recharge alone.", mid: "You enjoy people in doses and can step forward when needed.", high: "You're socially bold, lively and energized by groups. You often set the room's tone.",
    items: ["I feel comfortable being the center of attention.", "I usually feel cheerful and upbeat.", "-I avoid speaking up in groups.", "I enjoy meeting new people."] },
  { key: "A", label: "Agreeableness", blurb: "Patience, forgiveness and gentleness.", archetypes: ["the-harmonizer", "the-empath"],
    low: "You're quick to call out mistakes and slow to let things go — useful for standards, costly for relationships.", mid: "You're patient most of the time but will push back when something matters.", high: "You're forgiving, gentle and slow to anger. Make sure tolerance doesn't turn into self-erasure.",
    items: ["I forgive people easily.", "-I get irritated when people make mistakes.", "I rarely hold a grudge.", "-I criticize others when they don't meet my standards."] },
  { key: "C", label: "Conscientiousness", blurb: "Organization, diligence and prudence.", archetypes: ["the-strategist", "the-warden"],
    low: "You prefer flexibility to plans and act on impulse. That keeps you adaptable; systems can protect future you.", mid: "You're organized when it matters and relaxed when it doesn't.", high: "You're disciplined, careful and thorough. Others can count on you — sometimes too much.",
    items: ["I plan ahead and organize my tasks.", "I work hard to reach my goals.", "-I often make decisions on impulse.", "-I leave things messy."] },
  { key: "O", label: "Openness to Experience", blurb: "Curiosity, creativity and love of ideas.", archetypes: ["the-visionary", "the-maverick"],
    low: "You prefer the practical and familiar over the abstract.", mid: "You enjoy new ideas in moderation, grounded by what works.", high: "You're curious, imaginative and drawn to unusual ideas, art and nature.",
    items: ["I enjoy art and beauty in everyday life.", "I like thinking about abstract ideas.", "-I find philosophical discussions boring.", "I like people with unconventional views."] },
];

const { items, dimensions } = buildDims("hx", DIMS);

export const HEXACO_TEST: TestDef = {
  slug: "hexaco",
  name: "HEXACO Personality",
  category: "Personality",
  tagline: "Big Five, plus the factor most tests miss: Honesty-Humility.",
  metaDescription: "Take a free short HEXACO personality test covering Honesty-Humility, Emotionality, Extraversion, Agreeableness, Conscientiousness and Openness.",
  whatItMeasures: "This test estimates six broad personality factors: Honesty-Humility, Emotionality, eXtraversion, Agreeableness, Conscientiousness and Openness to Experience.",
  background: "Kibeom Lee and Michael Ashton developed the HEXACO model in the early 2000s after lexical studies across many languages consistently found a sixth factor beyond the Big Five — Honesty-Humility — which strongly predicts ethical behavior. This short form uses original items written for Cosmic Dossier.",
  citation: "Ashton, M. C., & Lee, K. (2009). The HEXACO-60: A short measure of the major dimensions of personality. Journal of Personality Assessment, 91(4), 340–345.",
  minutes: "~4 minutes",
  scale: AGREE_5,
  items,
  dimensions,
  ...multiDimHelpers(DIMS, "factor"),
};
