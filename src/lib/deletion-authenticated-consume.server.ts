import { resolveDeletionIdentity } from "./deletion-auth.server";
import { consumeDeletionAuthorization } from "./deletion-exchange.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Server-only, single-use authorization consumption for a future reviewed
 * deletion transaction. Never accept a client-supplied user ID.
 *
 * Authorization ID and secret must come from trusted server storage, not
 * browser input. This helper does NOT delete an account.
 */
export async function consumeAuthenticatedDeletionAuthorization(input: {
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
  const identity = await resolveDeletionIdentity({
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
