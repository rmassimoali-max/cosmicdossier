import { verifyPreflightedDeletionCode } from "./deletion-verification.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Staged server-only HTTP adapter for code verification. The caller must keep
 * the returned authorization secret in trusted server storage and return only
 * non-secret status to the browser. No route invokes this adapter.
 */
export async function handleDeletionCodeVerification(input: {
  request: Request;
  env: Record<string, string | undefined>;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  getSessionToken: () => string | null | Promise<string | null>;
  db: DeletionSqlExecutor;
  fetcher?: typeof fetch;
}) {
  const token = await input.getSessionToken();
  if (!token) throw new Error("Please sign in again.");

  const body: unknown = await input.request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid verification request.");
  }
  const values = body as Record<string, unknown>;
  if (typeof values["challengeId"] !== "string" || typeof values["code"] !== "string") {
    throw new Error("A deletion challenge and verification code are required.");
  }

  return verifyPreflightedDeletionCode({
    env: input.env,
    method: input.request.method,
    origin: input.request.headers.get("origin"),
    host: input.request.headers.get("host"),
    expectedOrigin: input.expectedOrigin,
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: token,
    db: input.db,
    challengeId: values["challengeId"],
    code: values["code"],
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });
}
