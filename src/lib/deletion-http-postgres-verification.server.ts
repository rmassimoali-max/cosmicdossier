import { handleStoredDeletionVerification } from "./deletion-http-stored-verification.server";
import { createPostgresDeletionAuthorizationStorage } from "./deletion-postgres-storage.server";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";

type Input = Omit<Parameters<typeof handleStoredDeletionVerification>[0], "storeAuthorization"> & {
  encryptionKey: Buffer;
};

/** Staged composition only. No public route or permanent deletion activation. */
export async function handlePostgresStoredDeletionVerification(input: Input) {
  const token = await input.getSessionToken();
  if (!token) throw new Error("Please sign in again.");
  const storage = createSessionAuthorizationStorage({
    storage: createPostgresDeletionAuthorizationStorage(input.db),
    key: input.encryptionKey,
    sessionToken: token,
  });
  return handleStoredDeletionVerification({
    ...input,
    getSessionToken: () => token,
    storeAuthorization: storage.save,
  });
}
