import { MBTI_QUESTIONS, scoreMbti } from "../assessments";
import { MBTI_LIBRARY } from "../interpret/mbti";
import { ARCHETYPES } from "../archetypes";
import type { TestDef } from "./types";

const estimates = (scores: Record<string, number>) =>
  Object.entries(scores).map(([label, percent]) => ({ label, percent }));
const topType = (scores: Record<string, number>) => estimates(scores)[0]?.label ?? "";

export const MBTI_TEST: TestDef = {
  slug: "mbti",
  name: "MBTI-Style Personality Test",
  category: "Personality",
  tagline: "Sixteen types, four preferences, one honest estimate.",
  whatItMeasures: "Your preferences on four pairs (Introversion/Extraversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving), combined into a probability spread across the 16 types instead of one forced label.",
  metaDescription: "Explore four pairs of personality preferences and your likely MBTI types with a probability spread, rather than one forced label, in 20 questions.",
  background: "The 16-type framework grew out of Carl Jung's theory of psychological types and was developed into a questionnaire by Katharine Briggs and Isabel Briggs Myers. Research suggests its four dimensions overlap with Big Five traits, and type categories are less stable than continuous trait scores, so treat the result as a useful vocabulary for preferences, not a fixed identity. This is an independent MBTI-style estimate. It is not the official MBTI instrument and is not affiliated with or endorsed by The Myers-Briggs Company.",
  citation: "McCrae, R. R., & Costa, P. T. (1989). Reinterpreting the Myers-Briggs Type Indicator from the perspective of the five-factor model of personality. Journal of Personality, 57(1), 17-40.",
  disclaimer: "Your type can shift with mood, context and life stage. Retake it on a different day to see how stable your result is.",
  minutes: "~4 minutes",
  answerMode: "choice",
  scale: { min: 1, max: 2, labels: [] },
  items: MBTI_QUESTIONS.map((q) => ({ id: q.id, text: q.prompt, dimension: "preferences", choices: [q.a, q.b] })),
  dimensions: [],
  scoreAnswers: (answers) => {
    const choices: Record<string, string> = {};
    for (const q of MBTI_QUESTIONS) {
      const choice = answers[q.id] === 1 ? q.a : q.b;
      choices[q.id] = choice.value;
    }
    return Object.fromEntries(scoreMbti(choices).map((e) => [e.label, e.percent]));
  },
  resultEstimates: estimates,
  resultLabel: (scores) => {
    const type = topType(scores);
    return `${type} — ${MBTI_LIBRARY[type]?.nickname ?? ""}`;
  },
  resultProfileType: topType,
  archetypeNote: (scores) => {
    const type = topType(scores);
    const code = type[1] === "N" ? type.slice(1, 3) : `S${type[3]}`;
    return {
      slugs: ARCHETYPES.filter((a) => a.flavor.mbti.includes(code)).map((a) => a.slug),
      text: `Your ${code} preferences connect with these Cosmic Dossier archetypes.`,
    };
  },
  articleSlugs: ["why-your-mbti-type-isnt-your-personality", "mbti-vs-big-five-whats-the-difference"],
  dossierPatch: (scores) => ({ mbti: topType(scores), mbtiEstimates: estimates(scores) }),
};