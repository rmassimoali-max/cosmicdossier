import { requireDeletionVerificationPreflight } from "./deletion-preflight.server";
import { consumeDeletionAuthorization } from "./deletion-exchange.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Final staged verification boundary, NOT an account deletion operation.
 * Authorization credentials must come from trusted server storage, not
 * client JSON, and a future route must enforce fresh reauthentication.
 */
export async function consumePreflightedDeletionAuthorization(input: {
  env: Record<string, string | undefined>;
  method: string;
  origin: string | null;
  host: string | null;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  db: DeletionSqlExecutor;
  authorizationId: string;
  authorizationSecret: string;
  fetcher?: typeof fetch;
}) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.authorizationId,
    ) ||
    !/^[0-9a-f]{64}$/.test(input.authorizationSecret)
  ) {
    return false;
  }

  const { identity } = await requireDeletionVerificationPreflight({
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

  return consumeDeletionAuthorization({
    db: input.db,
    userId: identity.userId,
    authorizationId: input.authorizationId,
    authorizationSecret: input.authorizationSecret,
  });
}
