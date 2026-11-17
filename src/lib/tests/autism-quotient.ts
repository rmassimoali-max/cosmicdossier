// Autism-Spectrum Quotient short form — five trait areas in the style of
// Baron-Cohen's AQ. Original items; not diagnostic.
import type { TestDef } from "./types";
import { scoreDimensions } from "./types";
import { AGREE_5, buildDims, singleBand, type DimSpec } from "./build";

const DIMS: DimSpec[] = [
  { key: "social", label: "Social Skills", blurb: "Ease in social situations (higher = more difficulty).", archetypes: ["the-observer"], low: "Social situations feel fairly intuitive to you.", mid: "Some social situations take effort, especially new or unstructured ones.", high: "Social situations often take deliberate effort and energy.",
    items: ["-I find social situations easy.", "I prefer doing things alone rather than with others.", "-I enjoy meeting new people."] },
  { key: "switching", label: "Attention Switching", blurb: "Shifting focus between tasks (higher = more difficulty).", archetypes: ["the-strategist"], low: "You switch tasks easily.", mid: "Interruptions sometimes throw you off.", high: "Switching focus is effortful; you prefer to finish one thing before starting another.",
    items: ["I get very absorbed in one thing and lose sight of others.", "-I can easily keep track of several conversations at once.", "Interruptions to my routine upset me."] },
  { key: "detail", label: "Attention to Detail", blurb: "Noticing patterns and small details.", archetypes: ["the-observer", "the-strategist"], low: "You focus on the big picture more than details.", mid: "You notice details when they matter.", high: "You notice small details and patterns others miss.",
    items: ["I notice patterns in things all the time.", "I often notice small sounds others don't.", "I'm fascinated by numbers, dates or license plates."] },
  { key: "communication", label: "Communication", blurb: "Reading conversational cues (higher = more difficulty).", archetypes: ["the-maverick"], low: "Conversational subtext comes naturally.", mid: "You occasionally miss hints or sarcasm.", high: "Implied meanings, small talk and conversational turn-taking can be confusing or draining.",
    items: ["-I can tell when someone is bored with what I'm saying.", "People tell me I go on about the same thing too much.", "-I find it easy to read between the lines."] },
  { key: "imagination", label: "Imagination", blurb: "Imagining others' perspectives and pretend scenarios (higher = more difficulty).", archetypes: ["the-strategist"], low: "You easily imagine stories and other people's inner worlds.", mid: "Imagining others' perspectives is sometimes effortful.", high: "You prefer facts to fiction and find it hard to imagine how characters or people feel.",
    items: ["-I find it easy to imagine what characters in a story look like.", "-I enjoy pretend or make-believe games.", "I find it hard to work out people's intentions."] },
];

const { items, dimensions } = buildDims("aq", DIMS);

export const AQ_TEST: TestDef = {
  slug: "autism-quotient",
  name: "Autism-Spectrum Quotient (Short)",
  category: "Neurodiversity",
  tagline: "Where your social and sensory style sits on the autistic-trait spectrum.",
  metaDescription: "Take a free short Autism-Spectrum Quotient style test exploring social skills, attention, detail, communication and imagination. Not a diagnosis.",
  whatItMeasures: "This test estimates autistic traits across five areas — social skills, attention switching, attention to detail, communication and imagination — and combines them into an overall AQ-style score.",
  background: "Simon Baron-Cohen and colleagues at Cambridge published the Autism-Spectrum Quotient in 2001 to measure autistic traits in adults of average intelligence. Traits are distributed across the whole population; a higher score is a reason to learn more, not a label.",
  citation: "Baron-Cohen, S., et al. (2001). The Autism-Spectrum Quotient (AQ). Journal of Autism and Developmental Disorders, 31(1), 5–17.",
  minutes: "~3 minutes",
  scale: AGREE_5,
  disclaimer: "This is not a diagnosis. Autism can only be identified through a professional assessment. Many people score high without being autistic, and vice versa.",
  items,
  dimensions: [
    { key: "overall", label: "Overall AQ Score", blurb: "Average across all five areas.", bands: [
      { min: 0, max: 35, label: "Fewer traits", text: "You report relatively few autistic traits overall." },
      { min: 36, max: 65, label: "Some traits", text: "You report a mix of autistic traits — common across the general population." },
      { min: 66, max: 100, label: "Many traits", text: "You report many autistic traits. If these have shaped your life, learning more or seeking an assessment may be helpful." },
    ] },
    ...dimensions,
  ],
  scoreAnswers: (answers) => {
    const s = scoreDimensions(items, AGREE_5, answers);
    const vals = DIMS.map((d) => s[d.key] ?? 0);
    return { overall: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), ...s };
  },
  resultLabel: (s) => singleBand(s["overall"] ?? 50, ["Fewer traits", "Some traits", "Many traits"]),
  resultSummary: (s) => `Your overall AQ-style score is ${s["overall"] ?? 50}/100.`,
  archetypeNote: (s) => (s["overall"] ?? 50) >= 66
    ? { slugs: ["the-observer", "the-strategist"], text: "Higher AQ-style scores often resonate with The Observer or The Strategist — pattern-seekers with deep, focused interests." }
    : { slugs: ["the-harmonizer", "the-firestarter"], text: "Lower AQ-style scores often resonate with The Harmonizer or The Firestarter — people energized by social flow." },
};
