import { consumeAuthenticatedDeletionAuthorization } from "./deletion-authenticated-consume.server";
import { createPostgresDeletionAuthorizationStorage } from "./deletion-postgres-storage.server";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";
import { resolveDeletionIdentity } from "./deletion-auth.server";

type Input = Omit<
  Parameters<typeof consumeAuthenticatedDeletionAuthorization>[0],
  "authorizationId" | "authorizationSecret"
> & { encryptionKey: Buffer };

/** Staged server-only entry point. Never accepts authorization credentials from a caller. */
export async function consumeSessionDeletionAuthorization(input: Input) {
  await resolveDeletionIdentity(input);
  const storage = createSessionAuthorizationStorage({
    storage: createPostgresDeletionAuthorizationStorage(input.db),
    key: input.encryptionKey,
    sessionToken: input.accessToken,
  });
  const authorization = await storage.take();
  if (!authorization) return false;
  return consumeAuthenticatedDeletionAuthorization({ ...input, ...authorization });
}
