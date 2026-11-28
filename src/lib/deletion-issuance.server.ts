import { requireDeletionVerificationPreflight } from "./deletion-preflight.server";
import { createDeletionChallengeStore, type DeletionSqlExecutor } from "./deletion-store.server";
import {
  requestDeletionEmailChallenge,
  type DeletionChallengeSender,
} from "./deletion-request.server";

/**
 * Staged server-only issuance pipeline. The trusted route must obtain headers
 * from the incoming request and accessToken from its HttpOnly cookie.
 * No route invokes this helper. It does not delete an account.
 */
export async function issuePreflightedDeletionChallenge(input: {
  env: Record<string, string | undefined>;
  method: string;
  origin: string | null;
  host: string | null;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  db: DeletionSqlExecutor;
  fetcher?: typeof fetch;
  sender?: DeletionChallengeSender;
  now?: Date;
}) {
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
  return requestDeletionEmailChallenge({
    store: createDeletionChallengeStore(input.db),
    emailConfig: backend.email,
    secret: backend.secret,
    userId: identity.userId,
    verifiedEmail: identity.verifiedEmail,
    ...(input.sender ? { sender: input.sender } : {}),
    ...(input.now ? { now: input.now } : {}),
  });
}
