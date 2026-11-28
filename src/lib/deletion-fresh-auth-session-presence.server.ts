import type { DeletionSqlExecutor } from "./deletion-store.server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Proposed separate read-only capability. Presence is necessary, not sufficient
// for liveness: provider timeout and revocation policies require further checks.
export const SESSION_PRESENCE_SQL =
  "select exists (select 1 from auth.sessions where id = $1::uuid and user_id = $2::uuid) as present";

export function createSessionPresenceLookup(db: DeletionSqlExecutor) {
  return async (identity: { userId: string; sessionId: string }): Promise<boolean> => {
    if (!uuid.test(identity.userId) || !uuid.test(identity.sessionId)) return false;
    const result = await db.query<{ present: boolean }>(SESSION_PRESENCE_SQL, [
      identity.sessionId,
      identity.userId,
    ]);
    return result.rows.length === 1 && result.rows[0]?.present === true;
  };
}
