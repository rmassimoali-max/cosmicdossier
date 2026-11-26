import { z } from "zod";
import { testBySlug } from "./tests";

const numericScores = z.record(z.string().min(1).max(80), z.number().finite().min(0).max(100));

export const saveAssessmentSchema = z
  .object({
    assessmentSlug: z.string().min(1).max(80),
    displayLabel: z.string().trim().max(100).optional(),
    scores: numericScores,
  })
  .strict()
  .superRefine((data, ctx) => {
    const test = testBySlug(data.assessmentSlug);
    if (!test?.dossierPatch) {
      ctx.addIssue({
        code: "custom",
        path: ["assessmentSlug"],
        message: "Unknown or unsupported assessment.",
      });
      return;
    }
    const actualKeys = Object.keys(data.scores);
    // Some scoring engines (MBTI and Enneagram) produce dynamic result keys
    // rather than the display dimensions used by the other tests.
    const expectedKeys = test.dimensions.map((dimension) => dimension.key).sort();
    const matchesDimensions =
      actualKeys.length === expectedKeys.length &&
      actualKeys
        .slice()
        .sort()
        .every((key, index) => key === expectedKeys[index]);
    const matchesMbti =
      data.assessmentSlug === "mbti" &&
      actualKeys.length === 16 &&
      actualKeys.every((key) => /^[EI][SN][TF][JP]$/.test(key));
    const matchesEnneagram =
      data.assessmentSlug === "enneagram" &&
      actualKeys.length >= 3 &&
      actualKeys.length <= 16 &&
      actualKeys.includes("core") &&
      actualKeys.includes("wing") &&
      Number.isInteger(data.scores["core"]) &&
      (data.scores["core"] ?? 0) >= 1 &&
      (data.scores["core"] ?? 0) <= 9 &&
      Number.isInteger(data.scores["wing"]) &&
      (data.scores["wing"] ?? 0) >= 1 &&
      (data.scores["wing"] ?? 0) <= 9;
    if (!matchesDimensions && !matchesMbti && !matchesEnneagram) {
      ctx.addIssue({
        code: "custom",
        path: ["scores"],
        message: "Scores do not match this assessment's scoring format.",
      });
    }
    if (JSON.stringify(data).length > 8192) {
      ctx.addIssue({ code: "custom", message: "Assessment payload too large." });
    }
  });

export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>;

// Never accept dossier patches or account ownership from the browser.
// Recompute the patch from validated scores on the server.
export function deriveAssessmentPatch(data: SaveAssessmentInput) {
  const test = testBySlug(data.assessmentSlug);
  if (!test?.dossierPatch) throw new Error("Unsupported assessment.");
  return test.dossierPatch(data.scores);
}
