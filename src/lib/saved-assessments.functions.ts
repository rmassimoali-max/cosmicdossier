import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
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
  let token = getCookie("cd_auth_access");
  const config = readSupabasePublicConfig(process.env);
  if (!config) throw new Error("Account storage is not configured.");

  // Match the account page's refresh behavior when the access cookie expires.
  // A failed refresh never grants access; Supabase verifies the resulting token.
  const verifyUser = async (access: string) =>
    fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
  let userResponse = token ? await verifyUser(token) : null;
  if (!userResponse?.ok) {
    const refresh = getCookie("cd_auth_refresh");
    if (!refresh) throw new Error("Sign in to access saved assessments.");
    const refreshed = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (!refreshed.ok) throw new Error("Your session has expired. Please sign in again.");
    const session = (await refreshed.json()) as {
      access_token?: unknown;
      refresh_token?: unknown;
      expires_in?: unknown;
    };
    if (typeof session.access_token !== "string" || typeof session.refresh_token !== "string") {
      throw new Error("Your session has expired. Please sign in again.");
    }
    token = session.access_token;
    const cookieOptions = {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    setCookie("cd_auth_access", token, {
      ...cookieOptions,
      maxAge:
        typeof session.expires_in === "number"
          ? Math.min(Math.max(session.expires_in, 60), 3600)
          : 3600,
    });
    setCookie("cd_auth_refresh", session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
    userResponse = await verifyUser(token);
  }
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
    ...(body ? { body: JSON.stringify({ ...body, user_id: userId }) } : {}),
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
  return z
    .array(rowSchema)
    .parse(payload)
    .map(({ dossier_patch, ...row }) => ({
      ...row,
      dossier_patch_json: JSON.stringify(dossier_patch),
    }));
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
    const record = saved[0];
    if (!record) throw new Error("Assessment was not saved.");
    const { dossier_patch, ...row } = record;
    return { ...row, dossier_patch_json: JSON.stringify(dossier_patch) };
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
