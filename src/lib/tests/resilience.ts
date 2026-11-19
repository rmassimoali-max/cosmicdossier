// Resilience — capacity to recover from stress, in the style of the
// Brief Resilience Scale (Smith et al.). Original items.
import type { TestDef } from "./types";
import { AGREE_5, singleBand } from "./build";

export const RESILIENCE_TEST: TestDef = {
  slug: "resilience",
  name: "Resilience",
  category: "Sensitivity & Emotional Style",
  tagline: "How quickly you bounce back when life knocks you down.",
  metaDescription:
    "Measure your ability to recover from stress and setbacks with this free, private resilience test based on brief resilience research.",
  whatItMeasures:
    "This test estimates resilience in its simplest sense: your ability to bounce back and recover after stress, hardship or setbacks.",
  background:
    "Bruce Smith and colleagues created the Brief Resilience Scale in 2008 to measure resilience as recovery itself rather than the resources that support it. Resilience is not fixed — it grows with sleep, support, meaning and practice.",
  citation:
    "Smith, B. W., et al. (2008). The Brief Resilience Scale: Assessing the ability to bounce back. International Journal of Behavioral Medicine, 15(3), 194–200.",
  minutes: "~2 minutes",
  scale: AGREE_5,
  disclaimer:
    "Low resilience during a hard season is normal, not a flaw. If you're struggling, reach out to someone you trust or a professional.",
  items: [
    { id: "rs1", text: "I tend to bounce back quickly after hard times.", dimension: "resilience" },
    {
      id: "rs2",
      text: "I have a hard time making it through stressful events.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs3",
      text: "It doesn't take me long to recover from a stressful event.",
      dimension: "resilience",
    },
    {
      id: "rs4",
      text: "It is hard for me to snap back when something bad happens.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs5",
      text: "I usually come through difficult times with little trouble.",
      dimension: "resilience",
    },
    {
      id: "rs6",
      text: "I tend to take a long time to get over setbacks.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs7",
      text: "I can find something to learn even in painful experiences.",
      dimension: "resilience",
    },
    { id: "rs8", text: "When plans fall apart, I adapt fairly fast.", dimension: "resilience" },
    {
      id: "rs9",
      text: "Small failures can ruin my whole week.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs10",
      text: "I have people and habits that steady me when things go wrong.",
      dimension: "resilience",
    },
  ],
  dimensions: [
    {
      key: "resilience",
      label: "Resilience",
      blurb: "Speed and ease of recovery after stress.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Slower recovery",
          text: "Setbacks currently take a real toll and linger. That's often a signal of depleted reserves rather than weak character — sleep, support and smaller goals rebuild capacity.",
        },
        {
          min: 36,
          max: 65,
          label: "Steady recovery",
          text: "You recover from most setbacks in time, though big hits can knock you off balance for a while. Your foundations are workable and can be strengthened.",
        },
        {
          min: 66,
          max: 100,
          label: "Fast recovery",
          text: "You bounce back quickly and tend to adapt rather than collapse. Remember that resilience includes asking for help — not only enduring alone.",
        },
      ],
    },
  ],
  resultLabel: (s) =>
    singleBand(s["resilience"] ?? 50, ["Slower recovery", "Steady recovery", "Fast recovery"]),
  resultSummary: (s) =>
    `Your resilience score is ${s["resilience"] ?? 50}/100 — a snapshot of how quickly you currently recover from stress.`,
  archetypeNote: (s) =>
    (s["resilience"] ?? 50) >= 66
      ? {
          slugs: ["the-warden", "the-firestarter"],
          text: "High resilience often resonates with The Warden or The Firestarter — people who stand back up and keep moving.",
        }
      : {
          slugs: ["the-empath", "the-observer"],
          text: "Slower recovery often resonates with The Empath or The Observer — people who feel and process deeply, and need deliberate recovery time.",
        },
};
