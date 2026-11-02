// Adult Attachment — ECR-R style short form: two dimensions
// (anxiety, avoidance) plotted into four quadrants.
import type { TestDef } from "./types";
import { scoreDimensions } from "./types";

const SCALE = {
  min: 1,
  max: 7,
  labels: [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ],
};

export function attachmentQuadrant(scores: Record<string, number>): string {
  const anxiety = scores["anxiety"] ?? 50;
  const avoidance = scores["avoidance"] ?? 50;
  if (anxiety < 50 && avoidance < 50) return "Secure";
  if (anxiety >= 50 && avoidance < 50) return "Anxious-Preoccupied";
  if (anxiety < 50 && avoidance >= 50) return "Dismissive-Avoidant";
  return "Fearful-Avoidant";
}

const QUADRANT_SUMMARY: Record<string, string> = {
  Secure:
    "Low anxiety, low avoidance. You can be close without losing yourself, and alone without feeling abandoned. Relationships are somewhere you go, not somewhere you brace.",
  "Anxious-Preoccupied":
    "High anxiety, low avoidance. You feel the bond intensely and scan for signs of distance. Connection is where you want to live — the work is trusting it can hold without constant confirmation.",
  "Dismissive-Avoidant":
    "Low anxiety, high avoidance. You rely on yourself first and experience too much closeness as pressure. Independence is genuine — the growth edge is letting it be chosen rather than compulsory.",
  "Fearful-Avoidant":
    "High anxiety, high avoidance. You crave closeness and fear it at the same time, often pulling away right when things get real. The pattern makes sense; it once kept you safe.",
};

export const ATTACHMENT_TEST: TestDef = {
  slug: "attachment-style",
  name: "Adult Attachment Style",
  category: "Relationships & Attachment",
  tagline: "How your nervous system learned to do closeness.",
  whatItMeasures:
    "This test places you on the two dimensions that define adult attachment: anxiety (fear of rejection and abandonment) and avoidance (discomfort with closeness and dependence). Together they describe your default strategy for staying safe in close relationships.",
  background:
    "Modern attachment measurement began with Hazan and Shaver applying Bowlby and Ainsworth's developmental theory to adult romantic bonds, and was formalised by Brennan, Clark and Shaver's Experiences in Close Relationships questionnaire, later revised as the ECR-R by Fraley, Waller and Brennan. This is a short, ECR-R-style form built on the same two-factor structure.",
  citation:
    "Fraley, R. C., Waller, N. G., & Brennan, K. A. (2000). An item response theory analysis of self-report measures of adult attachment. Journal of Personality and Social Psychology, 78(2), 350–365.",
  minutes: "~3 minutes",
  scale: SCALE,
  disclaimer:
    "Attachment style is a tendency, not a life sentence. Styles shift across relationships and can move toward security with awareness and experience.",
  items: [
    { id: "at1", text: "I worry that people I love will stop wanting me.", dimension: "anxiety" },
    { id: "at2", text: "I find it easy to depend on a partner.", dimension: "avoidance", reverse: true },
    { id: "at3", text: "Slow replies make my mind spiral.", dimension: "anxiety" },
    { id: "at4", text: "When someone gets too close, I start to need distance.", dimension: "avoidance" },
    { id: "at5", text: "I need frequent reassurance to feel settled in a relationship.", dimension: "anxiety" },
    { id: "at6", text: "I rarely ask for help, even when I need it.", dimension: "avoidance" },
    { id: "at7", text: "I often wonder whether I matter as much to others as they matter to me.", dimension: "anxiety" },
    { id: "at8", text: "I can be close to someone without losing myself.", dimension: "avoidance", reverse: true },
    { id: "at9", text: "When a partner is upset with me, it is hard to think about anything else.", dimension: "anxiety" },
    { id: "at10", text: "I prefer handling problems on my own rather than bringing them to someone.", dimension: "avoidance" },
    { id: "at11", text: "I read small changes in tone as signs that something is wrong.", dimension: "anxiety" },
    { id: "at12", text: "Talking about feelings comes naturally to me.", dimension: "avoidance", reverse: true },
    { id: "at13", text: "I fear that once people really know me, they will leave.", dimension: "anxiety" },
    { id: "at14", text: "Too much togetherness makes me want to escape.", dimension: "avoidance" },
    { id: "at15", text: "I trust that people who love me will stay.", dimension: "anxiety", reverse: true },
    { id: "at16", text: "I keep parts of myself private even from people I love.", dimension: "avoidance" },
    { id: "at17", text: "Conflict in a close relationship feels genuinely threatening to me.", dimension: "anxiety" },
    { id: "at18", text: "I am comfortable depending on others and having them depend on me.", dimension: "avoidance", reverse: true },
  ],
  dimensions: [
    {
      key: "anxiety",
      label: "Attachment Anxiety",
      blurb: "Fear of rejection and abandonment; the alarm system of the bond.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Low",
          text: "Your anxiety score is low. You generally trust that the people who love you will stay, and ambiguity does not automatically fill with worst cases.",
        },
        {
          min: 36,
          max: 65,
          label: "Moderate",
          text: "Your anxiety score is moderate. You notice shifts in the relationship and can name the worry without it dominating — most of the time.",
        },
        {
          min: 66,
          max: 100,
          label: "High",
          text: "Your anxiety score is high. Your attachment system is set to detect distance early and loudly. The sensitivity is real perceptiveness; the cost is a nervous system that rarely gets to rest inside a bond.",
        },
      ],
    },
    {
      key: "avoidance",
      label: "Attachment Avoidance",
      blurb: "Discomfort with closeness and dependence; the distance strategy.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Low",
          text: "Your avoidance score is low. Closeness does not register as pressure — you can depend on people and be depended on without feeling your autonomy slip.",
        },
        {
          min: 36,
          max: 65,
          label: "Moderate",
          text: "Your avoidance score is moderate. You value your independence and can still let people in, negotiating the distance case by case.",
        },
        {
          min: 66,
          max: 100,
          label: "High",
          text: "Your avoidance score is high. Self-reliance is your default and too much closeness reads as demand. The strategy protects you; it can also keep the very connection you want at arm's length.",
        },
      ],
    },
  ],
  resultLabel: attachmentQuadrant,
  resultSummary: (scores) => QUADRANT_SUMMARY[attachmentQuadrant(scores)] ?? "",
  archetypeNote: (scores) => {
    const q = attachmentQuadrant(scores);
    if (q === "Anxious-Preoccupied") {
      return {
        slugs: ["the-empath", "the-harmonizer"],
        text: "High anxiety with low avoidance often shows up in Cosmic Dossier language as The Empath or The Harmonizer under relational stress — someone who notices the emotional temperature of a room before anyone speaks.",
      };
    }
    if (q === "Dismissive-Avoidant") {
      return {
        slugs: ["the-maverick", "the-observer"],
        text: "Low anxiety with high avoidance often resonates with The Maverick or The Observer archetype — self-contained people who watch, decide and move on their own terms.",
      };
    }
    if (q === "Fearful-Avoidant") {
      return {
        slugs: ["the-empath", "the-maverick"],
        text: "The push-pull of high anxiety and high avoidance can look like The Empath and The Maverick taking turns — longing for the bond, then guarding against it.",
      };
    }
    return {
      slugs: ["the-warden", "the-harmonizer"],
      text: "A secure base often resonates with The Warden or The Harmonizer archetype — people who can hold others steadily because they are not bracing themselves.",
    };
  },
  articleSlug: "the-two-dimensions-of-attachment",
  dossierPatch: (scores) => {
    const q = attachmentQuadrant(scores);
    const map: Record<string, string> = {
      Secure: "Secure",
      "Anxious-Preoccupied": "Anxious",
      "Dismissive-Avoidant": "Dismissive Avoidant",
      "Fearful-Avoidant": "Fearful Avoidant",
    };
    return {
      attachment: map[q] ?? q,
      attachmentEstimates: [
        { label: "Anxiety", percent: scores["anxiety"] ?? 50 },
        { label: "Avoidance", percent: scores["avoidance"] ?? 50 },
      ],
    };
  },
};

export function scoreAttachmentTest(answers: Record<string, number>) {
  return scoreDimensions(ATTACHMENT_TEST.items, SCALE, answers);
}
