// Dark Triad — the Dirty Dozen (Jonason & Webster, 2010), 12 items.
import type { TestDef } from "./types";
import { scoreDimensions } from "./types";

const SCALE = {
  min: 1,
  max: 5,
  labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
};

export const DARK_TRIAD_TEST: TestDef = {
  slug: "dark-triad",
  name: "Dark Triad",
  category: "Dark Traits",
  tagline: "Three socially aversive traits everyone carries in some measure.",
  whatItMeasures:
    "The Dark Triad measures three related but distinct tendencies: Machiavellianism (strategic manipulation), Narcissism (grandiosity and entitlement) and Psychopathy (callousness and low remorse). Everyone scores somewhere — these are dimensions, not diagnoses.",
  background:
    "The Dark Triad construct was named by Paulhus and Williams in 2002 to describe three overlapping but separable socially aversive personality traits. This test uses the Dirty Dozen, a widely used 12-item short form developed by Jonason and Webster for research settings.",
  citation:
    "Jonason, P. K., & Webster, G. D. (2010). The Dirty Dozen: A concise measure of the Dark Triad. Psychological Assessment, 22(2), 420–432.",
  minutes: "~2 minutes",
  scale: SCALE,
  disclaimer:
    "This is not a diagnosis. Elevated scores describe tendencies, not character verdicts — and brief self-report screens like this one trade precision for speed.",
  items: [
    { id: "dt1", text: "I tend to manipulate others to get my way.", dimension: "machiavellianism" },
    { id: "dt2", text: "I tend to lack remorse.", dimension: "psychopathy" },
    { id: "dt3", text: "I tend to want others to admire me.", dimension: "narcissism" },
    { id: "dt4", text: "I have used deceit or lied to get my way.", dimension: "machiavellianism" },
    { id: "dt5", text: "I tend to be unconcerned with the morality of my actions.", dimension: "psychopathy" },
    { id: "dt6", text: "I tend to want others to pay attention to me.", dimension: "narcissism" },
    { id: "dt7", text: "I have used flattery to get my way.", dimension: "machiavellianism" },
    { id: "dt8", text: "I tend to be callous or insensitive.", dimension: "psychopathy" },
    { id: "dt9", text: "I tend to seek prestige or status.", dimension: "narcissism" },
    { id: "dt10", text: "I tend to exploit others towards my own end.", dimension: "machiavellianism" },
    { id: "dt11", text: "I tend to be cynical.", dimension: "psychopathy" },
    { id: "dt12", text: "I tend to expect special favors from others.", dimension: "narcissism" },
  ],
  dimensions: [
    {
      key: "machiavellianism",
      label: "Machiavellianism",
      blurb: "Strategic, calculating orientation toward getting what you want.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Machiavellianism score is low. You tend toward straightforward dealing and prefer influence you do not have to engineer.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Machiavellianism score is moderate. You can be strategic when the stakes call for it without making strategy your default posture.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Machiavellianism score is high. You read situations in terms of leverage and are willing to shape outcomes rather than wait for them. The same instrumentality that wins games can quietly tax trust.",
        },
      ],
    },
    {
      key: "narcissism",
      label: "Narcissism",
      blurb: "Appetite for admiration, status and special standing.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Narcissism score is low. Recognition is pleasant but not fuel; you do not need the room to orbit you.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Narcissism score is moderate. You enjoy being seen and valued, within the normal human range of wanting to matter.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Narcissism score is high. Admiration and status register as needs rather than bonuses. The confidence can be genuinely magnetic; the growth edge is what happens when the spotlight moves.",
        },
      ],
    },
    {
      key: "psychopathy",
      label: "Psychopathy",
      blurb: "Callousness, low remorse and cynicism — the coldest of the three.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Lower range",
          text: "Your Psychopathy score is low. Others' feelings register as real claims on you, and your conscience is an active participant in your decisions.",
        },
        {
          min: 36,
          max: 65,
          label: "Middle range",
          text: "Your Psychopathy score is moderate. You can be hard-headed when necessary without losing the thread of empathy.",
        },
        {
          min: 66,
          max: 100,
          label: "Upper range",
          text: "Your Psychopathy score is high. You tend toward detachment — less moved by guilt, sentiment or moral pressure than most. That detachment can be clarity under pressure; it can also cost the relationships that make pressure worth bearing.",
        },
      ],
    },
  ],
  resultSummary: (scores) => {
    const vals = Object.values(scores);
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    if (avg >= 66)
      return "Your overall Dark Core indication is elevated — these traits are active instruments in how you move through the world, not just occasional tools.";
    if (avg >= 36)
      return "Your overall Dark Core indication is moderate — within the normal range of strategic self-interest most people carry.";
    return "Your overall Dark Core indication is low — you default to straightforward, conscience-led dealing.";
  },
  archetypeNote: () => ({
    slugs: ["the-strategist", "the-maverick"],
    text: "In Cosmic Dossier language, pronounced dark-triad traits can resemble a shadow expression of The Strategist or The Maverick — the same independence and long-game thinking, turned inward toward self-interest. The archetype is not the trait; it is what the trait looks like when it is also in service of something larger.",
  }),
  articleSlug: "understanding-the-dark-triad",
};

export function scoreDarkTriadTest(answers: Record<string, number>) {
  return scoreDimensions(DARK_TRIAD_TEST.items, SCALE, answers);
}
