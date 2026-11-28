import { issuePreflightedDeletionChallenge } from "./deletion-issuance.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";
import type { DeletionChallengeSender } from "./deletion-request.server";

/**
 * Server-only HTTP adapter for a future request-code endpoint.
 * Reads method and origin from Request and uses the authenticated session
 * supplied by trusted server cookie middleware, never request JSON.
 *
 * Not registered as a route. Does not delete accounts.
 */
export async function handleDeletionCodeRequest(input: {
  request: Request;
  env: Record<string, string | undefined>;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  getSessionToken: () => string | null | Promise<string | null>;
  db: DeletionSqlExecutor;
  fetcher?: typeof fetch;
  sender?: DeletionChallengeSender;
  now?: Date;
}) {
  const token = await input.getSessionToken();
  if (!token) throw new Error("Please sign in again.");

  const result = await issuePreflightedDeletionChallenge({
    env: input.env,
    method: input.request.method,
    origin: input.request.headers.get("origin"),
    host: input.request.headers.get("host"),
    expectedOrigin: input.expectedOrigin,
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: token,
    db: input.db,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
    ...(input.sender ? { sender: input.sender } : {}),
    ...(input.now ? { now: input.now } : {}),
  });

  return { sent: result.sent, challengeId: result.challengeId, expiresAt: result.expiresAt };
}
