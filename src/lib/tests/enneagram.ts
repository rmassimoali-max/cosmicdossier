import { ENNEAGRAM_QUESTIONS, ENNEAGRAM_NAMES, LIKERT, scoreEnneagram } from "../assessments";
import { ENNEAGRAM_LIBRARY } from "../interpret/enneagram";
import { ARCHETYPES } from "../archetypes";
import type { TestDef } from "./types";

const estimates = (scores: Record<string, number>) =>
  Object.entries(scores).filter(([key]) => key !== "core" && key !== "wing")
    .map(([label, percent]) => ({ label, percent }));

export const ENNEAGRAM_TEST: TestDef = {
  slug: "enneagram",
  name: "Enneagram Test",
  category: "Personality",
  tagline: "Nine core motivations, and the one that drives you most.",
  whatItMeasures: "Your most likely core type out of nine, plus your likely wing, based on the motivations and fears you recognize in yourself rather than the behavior you show.",
  metaDescription: "Discover your likely Enneagram core type and wing by exploring the motivations and fears you recognize in yourself, rather than outward behavior.",
  background: "The modern Enneagram developed in the mid-20th century through Oscar Ichazo and Claudio Naranjo, drawing on older spiritual traditions and clinical observation. It is an interpretive framework for motivation and has much less empirical support than the Big Five, so treat it as a lens for reflection, not a measurement of fixed traits. This is a short, independent estimate.",
  disclaimer: "Many people recognize pieces of several types. Your wing and your top three results often say as much as the single top type.",
  minutes: "~3 minutes",
  scale: { min: 1, max: 5, labels: [...LIKERT] },
  items: ENNEAGRAM_QUESTIONS.map((q) => ({ id: q.id, text: q.prompt, dimension: String(q.type) })),
  dimensions: [],
  scoreAnswers: (answers) => {
    const result = scoreEnneagram(answers);
    return { core: result.core, wing: result.wing, ...Object.fromEntries(result.estimates.map((e) => [e.label, e.percent])) };
  },
  resultEstimates: estimates,
  resultLabel: (scores) => `${scores.core}w${scores.wing} — ${ENNEAGRAM_NAMES[scores.core ?? 9]}`,
  resultDetails: (scores) => {
    const profile = ENNEAGRAM_LIBRARY[scores.core ?? 9];
    return profile ? [
      { label: "Core motivation", text: profile.coreMotivation },
      { label: "Core fear", text: profile.coreFear },
      { label: "Core desire", text: profile.coreDesire },
    ] : [];
  },
  archetypeNote: (scores) => ({
    slugs: ARCHETYPES.filter((a) => new RegExp(`\\b${scores.core}\\b`).test(a.flavor.enneagram)).map((a) => a.slug),
    text: `Your Type ${scores.core} motivation connects with these Cosmic Dossier archetypes.`,
  }),
  dossierPatch: (scores) => ({
    enneagramType: String(scores.core),
    enneagramWing: String(scores.wing),
    enneagramEstimates: estimates(scores),
  }),
};