import { handleDeletionCodeVerification } from "./deletion-http-verification.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Server-only handoff for future deletion verification routes.
 * Storage must be isolated, authenticated, short-lived, and never accessible
 * from browser state. No route currently invokes this function.
 */
export async function handleStoredDeletionVerification(input: {
  request: Request;
  env: Record<string, string | undefined>;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  getSessionToken: () => string | null | Promise<string | null>;
  db: DeletionSqlExecutor;
  storeAuthorization: (authorization: {
    authorizationId: string;
    authorizationSecret: string;
  }) => Promise<void>;
  fetcher?: typeof fetch;
}) {
  const authorization = await handleDeletionCodeVerification({
    request: input.request,
    env: input.env,
    expectedOrigin: input.expectedOrigin,
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    getSessionToken: input.getSessionToken,
    db: input.db,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });

  // Persist before acknowledging success. A failed store must not result in
  // a verified browser response. Never log or serialize the credentials.
  await input.storeAuthorization(authorization);
  return { verified: true };
}
