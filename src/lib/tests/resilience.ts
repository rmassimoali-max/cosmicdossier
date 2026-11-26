// Exploratory resilience reflection with original items, not the validated BRS.
// New v2 IDs and item count avoid silently reinterpreting old shared answer URLs.
import type { TestDef } from "./types";
import { AGREE_5, singleBand } from "./build";

export const RESILIENCE_TEST: TestDef = {
  slug: "resilience",
  name: "Resilience",
  category: "Sensitivity & Emotional Style",
  tagline: "How you adapt, recover, and find support during difficult times.",
  metaDescription:
    "Explore coping, adaptability, support, and recovery with this free self-report resilience reflection.",
  whatItMeasures:
    "This exploratory questionnaire asks about different coping resources: adapting to change, finding next steps, seeking support, managing stress, and recovering from setbacks. It is not a validated resilience scale.",
  background:
    "Research distinguishes recovery after stress from the coping resources that can support it. Smith and colleagues’ Brief Resilience Scale focuses on recovery; this broader original-item reflection is not the BRS and has not been psychometrically validated.",
  citation:
    "Background reading only (not this questionnaire’s source): Smith, B. W., et al. (2008). The Brief Resilience Scale: Assessing the ability to bounce back. International Journal of Behavioral Medicine, 15(3), 194–200.",
  minutes: "~2 minutes",
  scale: AGREE_5,
  disclaimer:
    "Exploratory self-report only, not a diagnosis, standardized score, or validated psychological test. Results may vary with your circumstances. If you are struggling, consider reaching out for support.",
  items: [
    {
      id: "rs2_1",
      text: "When plans change unexpectedly, I can adjust my approach.",
      dimension: "resilience",
    },
    {
      id: "rs2_2",
      text: "When I feel overwhelmed, I struggle to identify one manageable next step.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs2_3",
      text: "After a setback, I can gradually return to my everyday responsibilities.",
      dimension: "resilience",
    },
    {
      id: "rs2_4",
      text: "I avoid asking for support even when it would help.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs2_5",
      text: "I can recognize when rest would help me cope better.",
      dimension: "resilience",
    },
    {
      id: "rs2_6",
      text: "A mistake makes it hard for me to try a different approach.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs2_7",
      text: "I can identify something useful I learned from a difficult experience.",
      dimension: "resilience",
    },
    {
      id: "rs2_8",
      text: "When a problem has no quick solution, I can tolerate some uncertainty.",
      dimension: "resilience",
    },
    {
      id: "rs2_9",
      text: "Under stress, I forget coping strategies that normally help me.",
      dimension: "resilience",
      reverse: true,
    },
    {
      id: "rs2_10",
      text: "I know a person or resource I could turn to during a difficult period.",
      dimension: "resilience",
    },
    {
      id: "rs2_11",
      text: "I can break a complicated problem into smaller actions.",
      dimension: "resilience",
    },
    {
      id: "rs2_12",
      text: "When I am upset, I can usually notice what I am feeling before reacting.",
      dimension: "resilience",
    },
  ],
  dimensions: [
    {
      key: "resilience",
      label: "Resilience",
      blurb: "Self-reported coping, adaptation, support, and recovery after stress.",
      bands: [
        {
          min: 0,
          max: 35,
          label: "Fewer accessible coping resources",
          text: "Several coping strategies may feel difficult to access right now. Context, support, and energy levels matter; this is not a fixed trait.",
        },
        {
          min: 36,
          max: 65,
          label: "Mixed coping resources",
          text: "You report access to some coping strategies, while others may need attention or support.",
        },
        {
          min: 66,
          max: 100,
          label: "Many accessible coping resources",
          text: "You report access to several ways of handling difficulty. That does not mean stress cannot affect you or that you must manage it alone.",
        },
      ],
    },
  ],
  resultLabel: (s) =>
    singleBand(s["resilience"] ?? 50, ["Slower recovery", "Steady recovery", "Fast recovery"]),
  resultSummary: (s) =>
    `Your exploratory resilience score is ${s["resilience"] ?? 50}/100 — a snapshot of reported coping resources, not a standardized or clinical score.`,
  archetypeNote: (s) =>
    (s["resilience"] ?? 50) >= 66
      ? {
          slugs: ["the-warden", "the-firestarter"],
          text: "Reporting many coping resources may resonate with The Warden or The Firestarter in the Cosmic Dossier archetype system.",
        }
      : {
          slugs: ["the-empath", "the-observer"],
          text: "Reporting fewer accessible coping resources may resonate with The Empath or The Observer in the Cosmic Dossier archetype system.",
        },
  dossierPatch: (scores) => ({ assessmentResults: { resilience: scores } }),
};
