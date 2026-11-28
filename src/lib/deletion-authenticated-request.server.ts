import { resolveDeletionIdentity } from "./deletion-auth.server";
import {
  requestDeletionEmailChallenge,
  type DeletionChallengeSender,
  type DeletionChallengeStore,
} from "./deletion-request.server";
import type { DeletionEmailConfig } from "./deletion-email.server";

/**
 * Staged server-only orchestration. A future POST route must retrieve the
 * access token from its HttpOnly session cookie, enforce CSRF/origin and
 * fresh reauthentication, and inject an isolated privileged database store.
 * Do not accept userId or email from request data.
 *
 * No route currently invokes this helper. It cannot delete an account.
 */
export async function requestAuthenticatedDeletionChallenge(input: {
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  store: DeletionChallengeStore;
  emailConfig: DeletionEmailConfig;
  secret: Buffer;
  fetcher?: typeof fetch;
  sender?: DeletionChallengeSender;
  now?: Date;
}) {
  const identity = await resolveDeletionIdentity({
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: input.accessToken,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });
  return requestDeletionEmailChallenge({
    store: input.store,
    emailConfig: input.emailConfig,
    secret: input.secret,
    userId: identity.userId,
    verifiedEmail: identity.verifiedEmail,
    ...(input.sender ? { sender: input.sender } : {}),
    ...(input.now ? { now: input.now } : {}),
  });
}
