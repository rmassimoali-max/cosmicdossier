// Big Five — Mini-IPIP (Donnellan et al., 2006), 20 public-domain items.
import type { TestDef } from "./types";
import { scoreDimensions } from "./types";

const SCALE = {
  min: 1,
  max: 5,
  labels: ["Very Inaccurate", "Inaccurate", "Neither", "Accurate", "Very Accurate"],
};

export const BIG_FIVE_TEST: TestDef = {
  slug: "big-five",
  name: "Big Five Personality",
  category: "Personality",
  tagline: "The most empirically grounded map of personality we have.",
  whatItMeasures:
    "The Big Five measures personality across five broad, statistically independent dimensions: Openness, Conscientiousness, Extraversion, Agreeableness and Neuroticism. Unlike type-based systems, it places you on continuous scales rather than in a box.",
  background:
    "The five-factor model emerged from decades of factor-analytic research beginning with Allport and Odbert's 1930s trait lexicon, converging into its modern form through the work of Lewis Goldberg, Paul Costa and Robert McCrae. This test uses the Mini-IPIP, a 20-item short form of the International Personality Item Pool, which is in the public domain.",
  citation:
    "Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP Scales. Psychological Assessment, 18(2), 192–203.",
  minutes: "~3 minutes",
  scale: SCALE,
  items: [
    { id: "bf1", text: "Am the life of the party.", dimension: "extraversion" },
    { id: "bf2", text: "Sympathize with others' feelings.", dimension: "agreeableness" },
    { id: "bf3", text: "Get chores done right away.", dimension: "conscientiousness" },
    { id: "bf4", text: "Have frequent mood swings.", dimension: "neuroticism" },
    { id: "bf5", text: "Have a vivid imagination.", dimension: "openness" },
    { id: "bf6", text: "Don't talk a lot.", dimension: "extraversion", reverse: true },
    { id: "bf7", text: "Am not really interested in others.", dimension: "agreeableness", reverse: true },
    { id: "bf8", text: "Like order.", dimension: "conscientiousness" },
    { id: "bf9", text: "Get upset easily.", dimension: "neuroticism" },
    { id: "bf10", text: "Have difficulty understanding abstract ideas.", dimension: "openness", reverse: true },
    { id: "bf11", text: "Talk to a lot of different people at parties.", dimension: "extraversion" },
    { id: "bf12", text: "Feel others' emotions.", dimension: "agreeableness" },
    { id: "bf13", text: "Often forget to put things back in their proper place.", dimension: "conscientiousness", reverse: true },
    { id: "bf14", text: "Am relaxed most of the time.", dimension: "neuroticism", reverse: true },
    { id: "bf15", text: "Am not interested in abstract ideas.", dimension: "openness", reverse: true },
    { id: "bf16", text: "Keep in the background.", dimension: "extraversion", reverse: true },
    { id: "bf17", text: "Am not interested in other people's problems.", dimension: "agreeableness", reverse: true },
    { id: "bf18", text: "Make a mess of things.", dimension: "conscientiousness", reverse: true },
    { id: "bf19", text: "Seldom feel blue.", dimension: "neuroticism", reverse: true },
    { id: "bf20", text: "Do not have a good imagination.", dimension: "openness", reverse: true },
  ],
  dimensions: [
    {
      key: "openness",
      label: "Openness",
      blurb: "Appetite for ideas, novelty, art and internal complexity.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Openness score sits in the lower range. You prefer the proven, the concrete and the clearly useful over the speculative. This gives you focus and consistency of method — you master things rather than sampling them.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Openness score sits in the middle range. You can move between novelty and reliability without needing either constantly — curious enough to explore, grounded enough to finish.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Openness score sits in the upper range. You tend to notice patterns and possibilities that others miss, and your inner life is vivid and layered. The cost is restlessness with routine and a mind that sometimes churns ideas past the point of completion.",
        },
      ],
    },
    {
      key: "conscientiousness",
      label: "Conscientiousness",
      blurb: "Orderliness, follow-through and impulse regulation.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Conscientiousness score sits in the lower range. You work in bursts driven by interest rather than schedule, and constraint feels heavier to you than chaos. Flexible deadlines and interest-led work suit you far better than rigid process.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Conscientiousness score sits in the middle range. You are organised when it matters and flexible when it does not — structured enough to be relied on, loose enough to adapt.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Conscientiousness score sits in the upper range. You plan, finish and hold standards, often past the point of comfort. Reliability is your signature; perfectionism and difficulty resting are its shadow.",
        },
      ],
    },
    {
      key: "extraversion",
      label: "Extraversion",
      blurb: "Where your energy comes from and how outwardly you spend it.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Extraversion score sits in the lower range. Solitude restores you and stimulation depletes faster than others realise. You prefer a few real conversations to many light ones, and your best thinking happens internally first.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Extraversion score sits in the middle range. You enjoy people in doses and recover in solitude — comfortable leading or listening, depending on what the moment asks for.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Extraversion score sits in the upper range. Contact energises you and you think partly by talking. You bring momentum and social ease, though silence that needed to stay open can get filled.",
        },
      ],
    },
    {
      key: "agreeableness",
      label: "Agreeableness",
      blurb: "Default posture toward others: accommodation versus challenge.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Agreeableness score sits in the lower range. You lead with candour and are unbothered by friction. People always know where they stand with you — though warmth may occasionally need translation.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Agreeableness score sits in the middle range. You cooperate readily but hold your line when it matters — kind and direct in the same conversation.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Agreeableness score sits in the upper range. Your default is cooperation, generosity and assuming good intent. You are easy to be close to — the growth edge is boundaries, and advocating for yourself as readily as you advocate for others.",
        },
      ],
    },
    {
      key: "neuroticism",
      label: "Neuroticism",
      blurb: "Sensitivity of the threat and distress system.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Neuroticism score sits in the lower range. You are unusually steady, slow to alarm and quick to settle. The blind spot: you can underestimate others' distress and read legitimate urgency as overreaction.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Neuroticism score sits in the middle range. You feel stress normally and recover at an ordinary pace — emotional access without flooding.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Neuroticism score sits in the upper range. Your threat system is sensitive and set to notice what could go wrong. Feelings arrive strongly and take longer to settle — the same sensitivity that drives rumination also gives you early risk detection and emotional depth.",
        },
      ],
    },
  ],
  resultSummary: (scores) => {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const names: Record<string, string> = {
      openness: "Openness",
      conscientiousness: "Conscientiousness",
      extraversion: "Extraversion",
      agreeableness: "Agreeableness",
      neuroticism: "Neuroticism",
    };
    const top = sorted[0];
    return top ? `${names[top[0]] ?? top[0]} is your most pronounced trait right now.` : "";
  },
  archetypeNote: (scores) => {
    const o = scores["openness"] ?? 50;
    const a = scores["agreeableness"] ?? 50;
    const e = scores["extraversion"] ?? 50;
    if (o >= 66 && e >= 66) {
      return {
        slugs: ["the-visionary", "the-firestarter"],
        text: "High Openness paired with high Extraversion often pairs with The Visionary or The Firestarter archetype — minds that see possibilities and move toward them out loud.",
      };
    }
    if (o >= 66) {
      return {
        slugs: ["the-visionary", "the-observer"],
        text: "Your Openness score sits in the upper range. In the Cosmic Dossier system this often pairs with The Visionary or The Observer archetype — minds that hold more than they immediately reveal.",
      };
    }
    if (a >= 66) {
      return {
        slugs: ["the-empath", "the-harmonizer"],
        text: "High Agreeableness often resonates with The Empath or The Harmonizer archetype — people who read the emotional temperature of a room before anyone speaks.",
      };
    }
    return {
      slugs: ["the-warden", "the-strategist"],
      text: "A grounded, steady profile like this often resonates with The Warden or The Strategist archetype — people who build, keep and deliberate rather than chase novelty.",
    };
  },
  articleSlug: "what-the-big-five-actually-measures",
  dossierPatch: (scores) => ({
    bigFive: {
      Openness: scores["openness"] ?? 50,
      Conscientiousness: scores["conscientiousness"] ?? 50,
      Extraversion: scores["extraversion"] ?? 50,
      Agreeableness: scores["agreeableness"] ?? 50,
      Neuroticism: scores["neuroticism"] ?? 50,
    },
  }),
};

export function scoreBigFiveTest(answers: Record<string, number>) {
  return scoreDimensions(BIG_FIVE_TEST.items, SCALE, answers);
}
