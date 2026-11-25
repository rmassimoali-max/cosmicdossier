import { resolveDeletionIdentity } from "./deletion-auth.server";
import { exchangeDeletionEmailCode } from "./deletion-exchange.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Server-only verification boundary for the staged deletion flow.
 * The account ID is resolved from Supabase Auth, never from browser input.
 * The returned authorization secret MUST remain in trusted server storage.
 * No route invokes this helper, and it cannot delete any account.
 */
export async function exchangeAuthenticatedDeletionCode(input: {
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  db: DeletionSqlExecutor;
  secret: Buffer;
  challengeId: string;
  code: string;
  fetcher?: typeof fetch;
}) {
  const identity = await resolveDeletionIdentity({
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: input.accessToken,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });
  return exchangeDeletionEmailCode({
    db: input.db,
    secret: input.secret,
    userId: identity.userId,
    challengeId: input.challengeId,
    code: input.code,
  });
}
