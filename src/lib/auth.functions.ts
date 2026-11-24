import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAuthCallbackUrl, readSupabasePublicConfig } from "./supabase-config";
import { hasRecoveryAuthorization } from "./recovery-guards";

const ACCESS = "cd_auth_access";
const REFRESH = "cd_auth_refresh";
const RECOVERY = "cd_auth_recovery";
const emailSchema = z.object({ email: z.string().trim().email().max(254) });
const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
const passwordSchema = z.object({ password: z.string().min(8).max(128) });
const displayNameSchema = z.object({ displayName: z.string().trim().min(1).max(60) });
const recoverySchema = z.object({ tokenHash: z.string().min(16).max(2048) });
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
  // A new session must never inherit permission from an earlier recovery session.
  deleteCookie(RECOVERY, { path: "/" });
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
  deleteCookie(RECOVERY, { path: "/" });
}

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const siteUrl = process.env["AUTH_SITE_URL"] ?? "https://www.cosmicdossier.com";
    const confirmUrl = new URL("/auth/confirmed", siteUrl).toString();
    const payload = await authRequest(`signup?redirect_to=${encodeURIComponent(confirmUrl)}`, data);
    if (typeof payload["access_token"] === "string") {
      saveTokens(payload);
      return { signedIn: true };
    }
    return { signedIn: false };
  });

export const signInWithPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const payload = await authRequest("token?grant_type=password", data);
    saveTokens(payload);
    return { success: true };
  });

export const requestMagicLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const siteUrl = process.env["AUTH_SITE_URL"] ?? "https://www.cosmicdossier.com";
    await authRequest(`otp?redirect_to=${encodeURIComponent(getAuthCallbackUrl(siteUrl))}`, {
      email: data.email,
      create_user: true,
    });
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
    if (!refresh) return { email: null, displayName: null };
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
    const metadata = user["user_metadata"];
    const displayName =
      metadata &&
      typeof metadata === "object" &&
      "display_name" in metadata &&
      typeof metadata.display_name === "string"
        ? metadata.display_name
        : null;
    return { email: typeof user["email"] === "string" ? user["email"] : null, displayName };
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

/** Always return a neutral response so callers cannot enumerate account emails. */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const siteUrl = process.env["AUTH_SITE_URL"] ?? "https://www.cosmicdossier.com";
    const redirectTo = new URL("/reset-password", siteUrl).toString();
    try {
      await authRequest(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
        email: data.email,
      });
    } catch {
      // Do not expose account existence or provider-specific recovery errors.
    }
    return { sent: true };
  });

/** Only a one-time Supabase recovery OTP can grant password-reset permission. */
export const verifyRecoveryToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recoverySchema.parse(input))
  .handler(async ({ data }) => {
    const payload = await authRequest("verify", { token_hash: data.tokenHash, type: "recovery" });
    saveTokens(payload);
    setCookie(RECOVERY, "1", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return { success: true };
  });

export const changeRecoveredPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => passwordSchema.parse(input))
  .handler(async ({ data }) => {
    const token = getCookie(ACCESS);
    if (!hasRecoveryAuthorization(token, getCookie(RECOVERY))) {
      throw new Error("Recovery session expired.");
    }
    const { url, publishableKey } = config();
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: data.password }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not update password.");
    clearTokens();
    return { success: true };
  });

/** Display name is presentation-only metadata, never an authorization claim. */
export const updateAccountDisplayName = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => displayNameSchema.parse(input))
  .handler(async ({ data }) => {
    const token = getCookie(ACCESS);
    if (!token) throw new Error("Please sign in again to update your profile.");
    const { url, publishableKey } = config();
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { display_name: data.displayName } }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not update your display name. Please try again.");
    return { success: true };
  });

/** Supabase handles confirmation of the new address; do not change local login state early. */
export const requestAccountEmailChange = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const token = getCookie(ACCESS);
    if (!token) throw new Error("Please sign in again to change your email.");
    const { url, publishableKey } = config();
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: data.email }),
      cache: "no-store",
    });
    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const code = errorPayload["code"] ?? errorPayload["error_code"];
      if (code === "email_exists") {
        throw new Error("That email address cannot be used. It may already belong to an account.");
      }
      if (code === "over_email_send_rate_limit" || response.status === 429) {
        throw new Error("Too many email requests. Please wait before trying again.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("Your session may have expired. Please sign in again.");
      }
      throw new Error("Could not request an email change. Please try again later.");
    }
    return { requested: true };
  });

/**
 * Verify a password against the currently signed-in account, without granting
 * account-deletion permission or changing the active session.
 * A successful check is informational only until a separate, short-lived,
 * single-use deletion authorization flow is implemented.
 */
export const previewVerifyDeletionPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => passwordSchema.parse(input))
  .handler(async ({ data }) => {
    const currentToken = getCookie(ACCESS);
    if (!currentToken) throw new Error("Please sign in again.");
    const current = await authRequest("user", undefined, currentToken);
    const userId = current["id"];
    const email = current["email"];
    if (typeof userId !== "string" || typeof email !== "string") {
      throw new Error("Could not verify your current account.");
    }
    // Do not call saveTokens: a password check must not replace auth cookies.
    const verified = await authRequest("token?grant_type=password", {
      email,
      password: data.password,
    });
    const checkedToken = verified["access_token"];
    if (typeof checkedToken !== "string") {
      throw new Error("Password verification failed.");
    }
    const checkedUser = await authRequest("user", undefined, checkedToken);
    if (checkedUser["id"] !== userId) {
      throw new Error("Password verification failed.");
    }
    return { verified: true, deletionEnabled: false };
  });

/**
 * Ask Supabase to send a fresh reauthentication code to the signed-in user.
 * This does not validate the code or authorize account deletion.
 */
export const requestDeletionReauthenticationCode = createServerFn({
  method: "POST",
}).handler(async () => {
  const token = getCookie(ACCESS);
  if (!token) throw new Error("Please sign in again.");
  const user = await authRequest("user", undefined, token);
  if (typeof user["id"] !== "string" || typeof user["email"] !== "string") {
    throw new Error("Please sign in again.");
  }
  await authRequest("reauthenticate", undefined, token);
  return { requested: true, deletionEnabled: false };
});
