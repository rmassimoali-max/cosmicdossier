import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { readSupabasePublicConfig } from "./supabase-config";
import { deriveAssessmentPatch, saveAssessmentSchema } from "./saved-assessments-validation";

const uuidSchema = z.string().uuid();
const rowSchema = z.object({
  id: uuidSchema,
  assessment_slug: z.string(),
  display_label: z.string().nullable(),
  result_version: z.number(),
  scores: z.record(z.string(), z.number()),
  dossier_patch: z.record(z.string(), z.unknown()),
  source_label: z.string().nullable(),
  created_at: z.string(),
});

async function authorizedRequest(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, unknown>,
) {
  const token = getCookie("cd_auth_access");
  if (!token) throw new Error("Sign in to access saved assessments.");
  const config = readSupabasePublicConfig(process.env);
  if (!config) throw new Error("Account storage is not configured.");

  // Verify the cookie against Supabase Auth, rather than decoding an untrusted JWT.
  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Your session has expired. Please sign in again.");
  const user = (await userResponse.json()) as { id?: unknown };
  const userId = uuidSchema.parse(user.id);

  const response = await fetch(`${config.url}/rest/v1/saved_assessments${path}`, {
    method,
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not access saved assessments. Please try again.");
  }
  const payload: unknown = await response.json();
  return { payload, userId };
}

export const listSavedAssessments = createServerFn({ method: "GET" }).handler(async () => {
  const { payload } = await authorizedRequest(
    "?select=id,assessment_slug,display_label,result_version,scores,dossier_patch,source_label,created_at&order=created_at.desc&limit=100",
    "GET",
  );
  return z.array(rowSchema).parse(payload);
});

export const saveAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveAssessmentSchema.parse(input))
  .handler(async ({ data }) => {
    // Do not trust ownership or dossier patches supplied by a browser.
    const patch = deriveAssessmentPatch(data);
    const { payload } = await authorizedRequest("", "POST", {
      assessment_slug: data.assessmentSlug,
      display_label: data.displayLabel ?? null,
      result_version: 1,
      scores: data.scores,
      dossier_patch: patch,
    });
    const saved = z.array(rowSchema).parse(payload);
    if (saved.length !== 1) throw new Error("Assessment was not saved.");
    return saved[0];
  });

export const deleteSavedAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: uuidSchema }).strict().parse(input))
  .handler(async ({ data }) => {
    const { payload } = await authorizedRequest(
      `?id=eq.${encodeURIComponent(data.id)}&select=id`,
      "DELETE",
    );
    const deleted = z.array(z.object({ id: uuidSchema })).parse(payload);
    return { deleted: deleted.length === 1 };
  });
