import { randomBytes, createHash } from "node:crypto";
import { hashDeletionEmailCode } from "./deletion-code.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/**
 * Server-only verification exchange. Requires independently authenticated
 * userId and challengeId from a trusted server session, never a client-supplied
 * user identity. This is NOT an account deletion endpoint.
 *
 * The raw authorization secret is returned only to its server caller.
 * Never serialize it into browser responses, logs, URLs, or analytics.
 */
export async function exchangeDeletionEmailCode(input: {
  db: DeletionSqlExecutor;
  secret: Buffer;
  userId: string;
  challengeId: string;
  code: string;
}) {
  const { db, secret, userId, challengeId, code } = input;
  const challengeHash = hashDeletionEmailCode(secret, userId, challengeId, code);
  const authorizationSecret = randomBytes(32).toString("hex");
  const authorizationHash = createHash("sha256").update(authorizationSecret).digest("hex");
  const result = await db.query<{ authorization_id: string | null }>(
    "select private.exchange_account_deletion_challenge($1::uuid, $2::uuid, $3::text, $4::text) as authorization_id",
    [challengeId, userId, challengeHash, authorizationHash],
  );
  const authorizationId = result.rows[0]?.authorization_id;
  if (result.rows.length !== 1 || !authorizationId) {
    throw new Error("Deletion verification code was invalid, expired, or already used.");
  }
  return { authorizationId, authorizationSecret };
}

/**
 * Single-use consumption of the short-lived authorization, for a future
 * separately reviewed server-only deletion transaction. Does not delete.
 */
export async function consumeDeletionAuthorization(input: {
  db: DeletionSqlExecutor;
  userId: string;
  authorizationId: string;
  authorizationSecret: string;
}) {
  const { db, userId, authorizationId, authorizationSecret } = input;
  if (!/^[0-9a-f]{64}$/.test(authorizationSecret)) {
    return false;
  }
  const authorizationHash = createHash("sha256").update(authorizationSecret).digest("hex");
  const result = await db.query<{ consumed: boolean }>(
    "select private.consume_account_deletion_authorization($1::uuid, $2::uuid, $3::text) as consumed",
    [authorizationId, userId, authorizationHash],
  );
  return result.rows.length === 1 && result.rows[0]?.consumed === true;
}
