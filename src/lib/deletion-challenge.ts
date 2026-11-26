import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const DELETION_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const DELETION_AUTHORIZATION_TTL_MS = 5 * 60 * 1000;
export const DELETION_MAX_ATTEMPTS = 5;

export type DeletionChallenge = {
  userId: string;
  purpose: "account_deletion";
  tokenHash: string;
  expiresAt: number;
  attempts: number;
  consumedAt: number | null;
};

export function issueDeletionChallenge(userId: string, now = Date.now()) {
  if (!userId) throw new Error("A verified account is required.");
  const token = randomBytes(32).toString("hex");
  return {
    token,
    record: {
      userId,
      purpose: "account_deletion" as const,
      tokenHash: hashDeletionToken(token),
      expiresAt: now + DELETION_CHALLENGE_TTL_MS,
      attempts: 0,
      consumedAt: null,
    },
  };
}

export function hashDeletionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function checkDeletionChallenge(
  record: DeletionChallenge,
  userId: string,
  token: string,
  now = Date.now(),
) {
  if (!userId || record.userId !== userId) return false;
  if (record.purpose !== "account_deletion") return false;
  if (record.consumedAt !== null || now >= record.expiresAt) return false;
  if (record.attempts >= DELETION_MAX_ATTEMPTS) return false;
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const candidate = Buffer.from(hashDeletionToken(token), "hex");
  const expected = Buffer.from(record.tokenHash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

// This module only supplies validation primitives. The caller MUST persist
// attempt increments and token consumption atomically in a database transaction.
// Never authorize deletion based solely on a true return value.
