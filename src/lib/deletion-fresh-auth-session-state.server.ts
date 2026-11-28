import type { DeletionSqlExecutor } from "./deletion-store.server";

export const SESSION_STATE_SQL =
  "select id::text as session_id, user_id::text as user_id, " +
  "floor(extract(epoch from created_at) * 1000)::bigint::text as created_ms, " +
  "floor(extract(epoch from refreshed_at) * 1000)::bigint::text as refreshed_ms, " +
  "floor(extract(epoch from not_after) * 1000)::bigint::text as expires_ms " +
  "from auth.sessions where id = $1::uuid and user_id = $2::uuid";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseTime(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

// Unwired SQL proposal. Provider schema and permissions must be verified separately.
// A missing refresh timestamp is rejected rather than guessed.
export function createSessionStateReader(db: DeletionSqlExecutor) {
  return async (identity: { userId: string; sessionId: string }) => {
    if (!uuid.test(identity.userId) || !uuid.test(identity.sessionId)) return null;
    const result = await db.query<Record<string, unknown>>(SESSION_STATE_SQL, [
      identity.sessionId,
      identity.userId,
    ]);
    const row = result.rows[0];
    if (
      result.rows.length !== 1 ||
      !row ||
      row["session_id"] !== identity.sessionId ||
      row["user_id"] !== identity.userId
    ) {
      return null;
    }
    const createdAt = parseTime(row["created_ms"]);
    const lastActivityAt = parseTime(row["refreshed_ms"]);
    const notAfter = parseTime(row["expires_ms"]);
    if (
      createdAt === null ||
      lastActivityAt === null ||
      (row["expires_ms"] !== null && notAfter === null)
    ) {
      return null;
    }
    return { ...identity, createdAt, lastActivityAt, notAfter };
  };
}
