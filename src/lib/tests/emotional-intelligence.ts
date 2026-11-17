// Emotional Intelligence — trait EI short screen across four branches
// (perception, use, understanding, management), in the spirit of Salovey & Mayer.
import type { TestDef } from "./types";
import { AGREE_5, buildDims, multiDimHelpers, type DimSpec } from "./build";

const DIMS: DimSpec[] = [
  { key: "perceiving", label: "Perceiving Emotions", blurb: "Reading feelings in faces, voices and yourself.", archetypes: ["the-empath", "the-observer"],
    low: "You tend to notice emotions late — often after they have already shaped a conversation. Slowing down to name what you see in faces and tone is the fastest lever here.",
    mid: "You read emotional signals reasonably well, especially with people you know. Under stress or with strangers, cues can slip past.",
    high: "You pick up emotional undercurrents quickly and accurately — in others and in yourself. The risk is absorbing what you perceive; the skill is noticing without carrying.",
    items: ["I can usually tell how someone feels just by looking at them.", "I notice when my own mood shifts, even slightly.", "-People's emotions often surprise me because I missed the signs.", "I pick up on tension in a room before anyone says anything."] },
  { key: "using", label: "Using Emotions", blurb: "Harnessing moods to think, create and decide.", archetypes: ["the-visionary", "the-firestarter"],
    low: "Feelings mostly feel like interruptions to your thinking. Learning which moods help which tasks can turn emotion from noise into fuel.",
    mid: "You sometimes use mood deliberately — a playlist for focus, a walk for perspective — but not consistently.",
    high: "You know how to put feelings to work: you match moods to tasks and use emotion as information when deciding.",
    items: ["I use my good moods to tackle creative work.", "When I'm motivated, I know how to keep that feeling going.", "-My emotions get in the way of my thinking more than they help it.", "I treat my gut feelings as useful data when making decisions."] },
  { key: "understanding", label: "Understanding Emotions", blurb: "Knowing why feelings arise and how they change.", archetypes: ["the-observer", "the-strategist"],
    low: "Emotions can feel like weather that arrives from nowhere. Tracing feelings back to triggers will make them more predictable.",
    mid: "You usually understand why you or others feel a certain way, though complex or mixed feelings can be harder to untangle.",
    high: "You have a strong map of emotional cause and effect — how frustration turns to resentment, how relief follows fear — which makes you a good interpreter of people.",
    items: ["I can usually explain why I feel the way I do.", "I understand how one feeling can turn into another over time.", "-Mixed feelings confuse me.", "I can predict how people will react emotionally to news."] },
  { key: "managing", label: "Managing Emotions", blurb: "Regulating your feelings and influencing others' states.", archetypes: ["the-harmonizer", "the-warden"],
    low: "Strong feelings tend to run their course before you can steer them. Small, practiced tools — breathing, pausing, naming — build this muscle.",
    mid: "You can regulate most everyday emotions, though intense moments still sometimes take the wheel.",
    high: "You can calm yourself and others under pressure, and you choose responses rather than reacting. Watch that composure doesn't become suppression.",
    items: ["I can calm myself down when I'm upset.", "I can help others feel better when they're down.", "-Once I'm angry, it's hard for me to get back on track.", "I stay composed in emotionally charged situations."] },
];

const { items, dimensions } = buildDims("ei", DIMS);

export const EI_TEST: TestDef = {
  slug: "emotional-intelligence",
  name: "Emotional Intelligence",
  category: "Sensitivity & Emotional Style",
  tagline: "How well you read, use, understand and steer emotion.",
  metaDescription: "Take a free emotional intelligence test measuring how you perceive, use, understand and manage emotions, with instant private results.",
  whatItMeasures: "This test estimates trait emotional intelligence across four branches: perceiving emotions, using emotions to think, understanding how emotions work, and managing them in yourself and others.",
  background: "Peter Salovey and John Mayer proposed emotional intelligence in 1990 as a set of abilities for processing emotional information; Daniel Goleman popularized it in 1995. Self-report measures like this one capture how you see your own emotional skills, which overlaps with — but isn't identical to — ability tests.",
  citation: "Salovey, P., & Mayer, J. D. (1990). Emotional intelligence. Imagination, Cognition and Personality, 9(3), 185–211.",
  minutes: "~3 minutes",
  scale: AGREE_5,
  disclaimer: "Self-report EI reflects self-perception. Use it as a reflection prompt, not a measure of worth.",
  items,
  dimensions,
  ...multiDimHelpers(DIMS, "emotional skill"),
};
