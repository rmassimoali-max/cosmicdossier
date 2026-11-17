// ADHD Trait Screen — inattention and hyperactivity/impulsivity, in the
// style of the adult self-report screener (ASRS). Original items; not diagnostic.
import type { TestDef } from "./types";
import { buildDims, multiDimHelpers, type DimSpec } from "./build";

const FREQ = { min: 1, max: 5, labels: ["Never", "Rarely", "Sometimes", "Often", "Very Often"] };

const DIMS: DimSpec[] = [
  { key: "inattention", label: "Inattention", blurb: "Focus, follow-through, organization and forgetfulness.", archetypes: ["the-visionary", "the-maverick"],
    low: "You report few attention difficulties — focus and follow-through come fairly easily.", mid: "You notice some attention lapses, especially with boring or long tasks. That's common and depends heavily on sleep, stress and interest.", high: "You report frequent trouble sustaining focus, finishing tasks and keeping track of things. If this has been true since childhood and affects several areas of life, a professional evaluation may be worth it.",
    items: ["I have trouble wrapping up the final details of a project.", "I lose or misplace things like keys, phone or paperwork.", "My mind wanders when someone is talking directly to me.", "I put off tasks that require a lot of thought.", "I make careless mistakes on boring or difficult work.", "I have difficulty getting organized for tasks."] },
  { key: "hyperactivity", label: "Hyperactivity / Impulsivity", blurb: "Restlessness, interrupting and acting before thinking.", archetypes: ["the-firestarter", "the-maverick"],
    low: "You report little restlessness or impulsivity — waiting and sitting still are manageable.", mid: "You feel restless or impulsive at times, often when under-stimulated.", high: "You report frequent restlessness and acting on impulse. Combined with lifelong patterns and real-life impact, this is worth discussing with a clinician.",
    items: ["I fidget or squirm when I have to sit for a long time.", "I feel driven, as if by a motor.", "I finish other people's sentences before they can.", "I have difficulty waiting my turn.", "I interrupt others when they are busy.", "I make decisions impulsively and regret them later."] },
];

const { items, dimensions } = buildDims("ad", DIMS);

export const ADHD_TEST: TestDef = {
  slug: "adhd-traits",
  name: "ADHD Trait Screen",
  category: "Neurodiversity",
  tagline: "A quick look at attention and restlessness patterns.",
  metaDescription: "Take a free, private ADHD trait screen covering inattention and hyperactivity-impulsivity in adults. Educational only, not a diagnosis.",
  whatItMeasures: "This screen estimates how often you experience two clusters of ADHD-associated traits in adulthood: inattention and hyperactivity/impulsivity.",
  background: "The World Health Organization's Adult ADHD Self-Report Scale (ASRS) was developed with Ronald Kessler and colleagues as a brief screener based on DSM criteria. This version uses original items in the same spirit. ADHD traits exist on a spectrum, and many people experience some of them.",
  citation: "Kessler, R. C., et al. (2005). The World Health Organization Adult ADHD Self-Report Scale (ASRS). Psychological Medicine, 35(2), 245–256.",
  minutes: "~3 minutes",
  scale: FREQ,
  disclaimer: "This is not a diagnosis. Only a qualified clinician can diagnose ADHD, which requires lifelong patterns and real impairment. Sleep, anxiety and stress can mimic these traits.",
  items,
  dimensions,
  ...multiDimHelpers(DIMS, "trait cluster"),
  resultLabel: (s) => {
    const m = Math.max(s["inattention"] ?? 0, s["hyperactivity"] ?? 0);
    return m >= 66 ? "Many traits reported" : m >= 36 ? "Some traits reported" : "Few traits reported";
  },
};
