import { requireDeletionVerificationPreflight } from "./deletion-preflight.server";
import { exchangeDeletionEmailCode } from "./deletion-exchange.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Staged, server-only code verification pipeline. The returned authorization
 * secret must be retained only in trusted server storage and never serialized
 * to a browser response. No route invokes this and no deletion occurs.
 */
export async function verifyPreflightedDeletionCode(input: {
  env: Record<string, string | undefined>;
  method: string;
  origin: string | null;
  host: string | null;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  db: DeletionSqlExecutor;
  challengeId: string;
  code: string;
  fetcher?: typeof fetch;
}) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.challengeId,
    ) ||
    !/^[0-9]{8}$/.test(input.code)
  ) {
    throw new Error("A valid deletion challenge and eight-digit code are required.");
  }

  const { identity, backend } = await requireDeletionVerificationPreflight({
    env: input.env,
    method: input.method,
    origin: input.origin,
    host: input.host,
    expectedOrigin: input.expectedOrigin,
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: input.accessToken,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });

  return exchangeDeletionEmailCode({
    db: input.db,
    secret: backend.secret,
    userId: identity.userId,
    challengeId: input.challengeId,
    code: input.code,
  });
}
