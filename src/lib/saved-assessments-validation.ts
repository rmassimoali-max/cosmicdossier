import { z } from "zod";
import { testBySlug } from "./tests";

const numericScores = z.record(z.string().min(1).max(80), z.number().finite().min(-10000).max(10000));
const patchSchema = z
  .object({
    mbti: z.string().max(16).optional(),
    enneagramType: z.string().max(24).optional(),
    enneagramWing: z.string().max(24).optional(),
    enneagramInstinct: z.string().max(40).optional(),
    attachment: z.string().max(60).optional(),
    bigFive: numericScores.optional(),
    hexaco: numericScores.optional(),
    hsp: z.number().finite().min(-10000).max(10000).optional(),
    assessmentResults: z.record(z.string().max(80), numericScores).optional(),
  })
  .strict();

export const saveAssessmentSchema = z
  .object({
    assessmentSlug: z.string().min(1).max(80),
    displayLabel: z.string().trim().max(100).optional(),
    scores: numericScores,
    dossierPatch: patchSchema,
    sourceLabel: z.string().trim().max(160).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const test = testBySlug(data.assessmentSlug);
    if (!test) {
      ctx.addIssue({ code: "custom", path: ["assessmentSlug"], message: "Unknown assessment." });
      return;
    }
    if (Object.keys(data.scores).length === 0 || Object.keys(data.scores).length > 64) {
      ctx.addIssue({ code: "custom", path: ["scores"], message: "Invalid score count." });
    }
    const expected = test.dossierPatch?.(data.scores);
    if (!expected || JSON.stringify(expected) !== JSON.stringify(data.dossierPatch)) {
      ctx.addIssue({
        code: "custom",
        path: ["dossierPatch"],
        message: "Assessment patch must match the server-derived result.",
      });
    }
    if (JSON.stringify(data).length > 20000) {
      ctx.addIssue({ code: "custom", message: "Assessment payload too large." });
    }
  });

export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>;
