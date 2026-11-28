import type { DeletionSqlExecutor } from "./deletion-store.server";

export const FRESH_AUTH_RESERVE_SQL =
  "select private.reserve_deletion_fresh_auth_attempt($1::uuid) as reserved";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Staged adapter. Requires a dedicated restricted executor with Read Committed
// transactions. The account must come from verified provider identity.
export function createFreshAuthRateReservation(db: DeletionSqlExecutor, userId: string) {
  return async (): Promise<boolean> => {
    if (!uuid.test(userId)) return false;
    const result = await db.query<{ reserved: boolean }>(FRESH_AUTH_RESERVE_SQL, [userId]);
    return result.rows.length === 1 && result.rows[0]?.reserved === true;
  };
}
