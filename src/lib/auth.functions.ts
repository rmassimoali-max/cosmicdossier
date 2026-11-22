import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAuthCallbackUrl, readSupabasePublicConfig } from "./supabase-config";

const ACCESS = "cd_auth_access";
const REFRESH = "cd_auth_refresh";
const emailSchema = z.object({ email: z.string().trim().email().max(254) });
const callbackSchema = z.object({
  tokenHash: z.string().min(16).max(2048),
  type: z.enum(["magiclink", "email", "signup"]),
});

function config() {
  const result = readSupabasePublicConfig(process.env);
  if (!result) throw new Error("Account sign-in is not configured yet.");
  return result;
}

async function authRequest(
  path: string,
  body: Record<string, unknown> | undefined,
  accessToken?: string,
) {
  const { url, publishableKey } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error("Authentication request could not be completed.");
  return json;
}

function saveTokens(payload: Record<string, unknown>) {
  const access = payload["access_token"];
  const refresh = payload["refresh_token"];
  const expires = payload["expires_in"];
  if (typeof access !== "string" || typeof refresh !== "string") {
    throw new Error("Authentication response did not contain a valid session.");
  }
  const secure = process.env["NODE_ENV"] === "production";
  const maxAge = typeof expires === "number" ? Math.min(Math.max(expires, 60), 3600) : 3600;
  setCookie(ACCESS, access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  setCookie(REFRESH, refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearTokens() {
  deleteCookie(ACCESS, { path: "/" });
  deleteCookie(REFRESH, { path: "/" });
}

export const requestMagicLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const siteUrl = process.env["AUTH_SITE_URL"] ?? "https://www.cosmicdossier.com";
    await authRequest(
      `otp?redirect_to=${encodeURIComponent(getAuthCallbackUrl(siteUrl))}`,
      { email: data.email, create_user: true },
    );
    return { sent: true };
  });

export const completeMagicLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callbackSchema.parse(input))
  .handler(async ({ data }) => {
    const payload = await authRequest("verify", {
      token_hash: data.tokenHash,
      type: data.type,
    });
    saveTokens(payload);
    return { success: true };
  });

export const getCurrentAccount = createServerFn({ method: "GET" }).handler(async () => {
  let token = getCookie(ACCESS);
  if (!token) {
    const refresh = getCookie(REFRESH);
    if (!refresh) return { email: null };
    try {
      const payload = await authRequest("token?grant_type=refresh_token", {
        refresh_token: refresh,
      });
      saveTokens(payload);
      token = String(payload["access_token"] ?? "");
    } catch {
      clearTokens();
      return { email: null };
    }
  }
  try {
    const user = await authRequest("user", undefined, token);
    return { email: typeof user["email"] === "string" ? user["email"] : null };
  } catch {
    clearTokens();
    return { email: null };
  }
});

export const signOutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(ACCESS);
  if (token) {
    try {
      await authRequest("logout", {}, token);
    } catch {
      // Local sign-out must work even if the provider is temporarily unavailable.
    }
  }
  clearTokens();
  return { success: true };
});
