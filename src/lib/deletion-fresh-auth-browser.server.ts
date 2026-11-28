import { randomBytes } from "node:crypto";

const cookieName = "__Host-deletion-fresh-auth";
const bindingPattern = /^[0-9a-f]{64}$/;

/** Internal only. Issue a new binding for each fresh-auth flow over HTTPS. */
export function createFreshAuthBrowserBinding() {
  const browserBinding = randomBytes(32).toString("hex");
  return {
    browserBinding,
    setCookie:
      cookieName +
      "=" +
      browserBinding +
      "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=600",
  };
}

/** Reject ambiguous cookies rather than choosing between duplicate values. */
export function readFreshAuthBrowserBinding(cookieHeader: string): string | null {
  const matches = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(cookieName + "="));
  if (matches.length !== 1) return null;
  const value = matches[0]?.slice(cookieName.length + 1);
  return value && bindingPattern.test(value) ? value : null;
}

export function clearFreshAuthBrowserBinding(): string {
  return cookieName + "=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0";
}
