import { createHmac, randomInt } from "node:crypto";

/**
 * Server-only 8-digit account deletion email codes.
 * A keyed HMAC prevents offline guessing from leaked database hashes.
 * The key MUST be independent of Supabase and other application secrets.
 */
export function readDeletionCodeSecret(env: Record<string, string | undefined>) {
  const secret = env["DELETION_CODE_HMAC_SECRET"];
  if (!secret) return null;
  if (!/^(?:[0-9a-f]{2}){32,}$/i.test(secret)) {
    throw new Error("Deletion code secret must be at least 32 random bytes encoded as hex.");
  }
  return Buffer.from(secret, "hex");
}

export function generateDeletionEmailCode() {
  return randomInt(0, 100_000_000).toString().padStart(8, "0");
}

export function hashDeletionEmailCode(
  secret: Buffer,
  userId: string,
  challengeId: string,
  code: string,
) {
  if (secret.length < 32) throw new Error("Deletion code secret is too short.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(userId) ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(challengeId) ||
    !/^\d{8}$/.test(code)
  ) {
    throw new Error("Invalid deletion code context.");
  }
  return createHmac("sha256", secret)
    .update("cosmic-dossier:account-deletion:v1\0")
    .update(userId)
    .update("\0")
    .update(challengeId)
    .update("\0")
    .update(code)
    .digest("hex");
}
