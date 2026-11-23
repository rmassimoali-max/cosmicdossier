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
    const expectedKeys = test.dimensions.map((dimension) => dimension.key).sort();
    const actualKeys = Object.keys(data.scores).sort();
    if (
      expectedKeys.length !== actualKeys.length ||
      expectedKeys.some((key, index) => key !== actualKeys[index])
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scores"],
        message: "Scores do not match this assessment's dimensions.",
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
