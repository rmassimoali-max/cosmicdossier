import { randomUUID } from "node:crypto";
import { generateDeletionEmailCode, hashDeletionEmailCode } from "./deletion-code.server";
import { sendDeletionVerificationEmail, type DeletionEmailConfig } from "./deletion-email.server";

/**
 * Server-only orchestration primitive. No route calls this yet.
 * Storage must enforce per-user rate limits and an atomic active-challenge
 * policy in the database, not in process memory.
 */
export type DeletionChallengeStore = {
  create(input: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  revoke(id: string, userId: string): Promise<void>;
};

export type DeletionChallengeSender = (
  config: DeletionEmailConfig,
  recipient: string,
  code: string,
) => Promise<{ sent: boolean }>;

export async function requestDeletionEmailChallenge(input: {
  store: DeletionChallengeStore;
  sender?: DeletionChallengeSender;
  emailConfig: DeletionEmailConfig;
  secret: Buffer;
  userId: string;
  verifiedEmail: string;
  now?: Date;
}) {
  const { store, emailConfig, secret, userId, verifiedEmail } = input;
  const sender = input.sender ?? sendDeletionVerificationEmail;
  const id = randomUUID();
  const code = generateDeletionEmailCode();
  const tokenHash = hashDeletionEmailCode(secret, userId, id, code);
  const expiresAt = new Date((input.now ?? new Date()).getTime() + 10 * 60 * 1000);

  // Persist before delivery. A failed delivery invalidates the record.
  await store.create({ id, userId, tokenHash, expiresAt });
  try {
    const result = await sender(emailConfig, verifiedEmail, code);
    if (!result.sent) throw new Error("Verification email was not accepted.");
  } catch {
    // Fail closed: if revocation fails, never claim that the challenge was
    // safely invalidated. Production adapter must retry/reconcile failures.
    try {
      await store.revoke(id, userId);
    } catch {
      throw new Error("Deletion verification delivery and revocation failed.");
    }
    throw new Error("Could not send deletion verification. Please try again later.");
  }
  // Do not return the secret code or hash to the browser.
  return { challengeId: id, expiresAt: expiresAt.toISOString(), sent: true };
}
