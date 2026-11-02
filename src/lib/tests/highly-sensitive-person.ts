// Highly Sensitive Person — sensory processing sensitivity, short form
// in the style of Elaine Aron's HSP scale.
import type { TestDef } from "./types";
import { scoreDimensions } from "./types";

const SCALE = {
  min: 1,
  max: 7,
  labels: [
    "Not at All",
    "Rarely",
    "Occasionally",
    "Sometimes",
    "Often",
    "Very Often",
    "Extremely",
  ],
};

export const HSP_TEST: TestDef = {
  slug: "highly-sensitive-person",
  name: "Highly Sensitive Person",
  category: "Sensitivity & Emotional Style",
  tagline: "A nervous system tuned to notice more — and feel it longer.",
  whatItMeasures:
    "This test measures sensory processing sensitivity: how deeply your nervous system registers and processes stimulation — sounds, lights, other people's moods, caffeine, pain, art. High sensitivity is a temperament trait found in roughly 15–20% of people, not a disorder.",
  background:
    "Elaine Aron introduced the concept of the Highly Sensitive Person in the 1990s, framing deep processing, overstimulation, emotional reactivity and sensitivity to subtleties as a single inherited temperament trait. Researchers now often discuss it alongside the orchid-dandelion-tulip model of environmental sensitivity.",
  citation:
    "Aron, E. N., & Aron, A. (1997). Sensory-processing sensitivity and its relation to introversion and emotionality. Journal of Personality and Social Psychology, 73(2), 345–368.",
  minutes: "~2 minutes",
  scale: SCALE,
  disclaimer:
    "This is not a diagnosis. Sensitivity is a neutral temperament dimension — its value depends entirely on the environment it meets.",
  items: [
    { id: "hs1", text: "I am easily overwhelmed by strong sensory input.", dimension: "sensitivity" },
    { id: "hs2", text: "I seem to be aware of subtleties in my environment.", dimension: "sensitivity" },
    { id: "hs3", text: "Other people's moods affect me.", dimension: "sensitivity" },
    { id: "hs4", text: "I find myself needing to withdraw during busy days.", dimension: "sensitivity" },
    { id: "hs5", text: "I have a rich, complex inner life.", dimension: "sensitivity" },
    { id: "hs6", text: "I am deeply moved by the arts or music.", dimension: "sensitivity" },
    { id: "hs7", text: "Loud or chaotic environments wear me down quickly.", dimension: "sensitivity" },
    { id: "hs8", text: "I notice small changes others seem to miss — a tone, a scent, a shift in light.", dimension: "sensitivity" },
    { id: "hs9", text: "I am sensitive to caffeine, hunger or pain.", dimension: "sensitivity" },
    { id: "hs10", text: "I need more recovery time than most people after intense days.", dimension: "sensitivity" },
    { id: "hs11", text: "I am conscientious about details because errors genuinely bother me.", dimension: "sensitivity" },
    { id: "hs12", text: "Violent or distressing media stays with me long after.", dimension: "sensitivity" },
    { id: "hs13", text: "I think deeply about experiences long after they happen.", dimension: "sensitivity" },
    { id: "hs14", text: "Being observed or evaluated makes me noticeably more nervous.", dimension: "sensitivity" },
  ],
  dimensions: [
    {
      key: "sensitivity",
      label: "Sensory Processing Sensitivity",
      blurb: "Depth of processing, overstimulation, emotional reactivity, subtlety detection.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Dandelion range",
          text: "Your sensitivity score is low — the dandelion range. You are built for throughput: stimulation rolls off you, and you can function in environments that would flatten more finely tuned nervous systems. The trade-off is that subtleties others catch may pass you by.",
        },
        {
          min: 36,
          max: 65,
          label: "Tulip range",
          text: "Your sensitivity score is moderate — the tulip range. You are responsive to your environment without being ruled by it: you notice more than the dandelion, recover faster than the orchid, and can flex toward either depending on the conditions.",
        },
        {
          min: 66,
          max: 100,
          label: "Orchid range",
          text: "Your sensitivity score is high — the orchid range. You process experience deeply: beauty, tension, noise and other people's states all arrive at high volume. In the right environment this is a genuine gift — perception, empathy and depth. In the wrong one it is exhaustion. The work is designing a life that fits the instrument.",
        },
      ],
    },
  ],
  resultLabel: (scores) => {
    const s = scores["sensitivity"] ?? 50;
    if (s >= 66) return "Orchid";
    if (s >= 36) return "Tulip";
    return "Dandelion";
  },
  resultSummary: (scores) => {
    const s = scores["sensitivity"] ?? 50;
    if (s >= 66)
      return "High sensory processing sensitivity. Your nervous system takes in more per moment than most — and asks for more recovery in return.";
    if (s >= 36)
      return "Moderate sensory processing sensitivity. You are responsive to your environment without being ruled by it.";
    return "Lower sensory processing sensitivity. You are built for throughput — sturdy across a wide range of conditions.";
  },
  archetypeNote: (scores) => {
    const s = scores["sensitivity"] ?? 50;
    if (s >= 66) {
      return {
        slugs: ["the-empath", "the-observer"],
        text: "High sensitivity often resonates with The Empath or The Observer archetype — people whose gift is registering what others miss, and whose discipline is learning when to close the door.",
      };
    }
    if (s >= 36) {
      return {
        slugs: ["the-harmonizer", "the-visionary"],
        text: "Moderate sensitivity often resonates with The Harmonizer or The Visionary archetype — responsive to the world, but with enough ballast to move through it steadily.",
      };
    }
    return {
      slugs: ["the-warden", "the-firestarter"],
      text: "Lower sensitivity often resonates with The Warden or The Firestarter archetype — constitutions built for pressure, noise and momentum.",
    };
  },
  articleSlug: "the-orchid-hypothesis-sensitivity-as-temperament",
  dossierPatch: (scores) => ({ hsp: scores["sensitivity"] ?? 50 }),
};

export function scoreHspTest(answers: Record<string, number>) {
  return scoreDimensions(HSP_TEST.items, SCALE, answers);
}
