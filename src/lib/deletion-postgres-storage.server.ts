import type { DeletionAuthorizationStorage } from "./deletion-session-storage.server";
import type { DeletionSqlExecutor } from "./deletion-store.server";

/** Requires the staged private storage functions and a restricted server SQL connection. */
export function createPostgresDeletionAuthorizationStorage(
  db: DeletionSqlExecutor,
): DeletionAuthorizationStorage {
  return {
    async put(key, value, ttlMs) {
      if (
        !/^[0-9a-f]{64}$/.test(key) ||
        !value ||
        value.length > 4096 ||
        !Number.isInteger(ttlMs) ||
        ttlMs < 1 ||
        ttlMs > 240_000
      ) {
        throw new Error("Invalid deletion authorization storage input.");
      }
      const result = await db.query<{ stored: boolean }>(
        "select private.put_deletion_session_authorization($1::text, $2::text, $3::integer) as stored",
        [key, value, ttlMs],
      );
      if (result.rows.length !== 1 || result.rows[0]?.stored !== true) {
        throw new Error("Could not store deletion authorization.");
      }
    },
    async take(key) {
      if (!/^[0-9a-f]{64}$/.test(key)) return null;
      const result = await db.query<{ envelope: string | null }>(
        "select private.take_deletion_session_authorization($1::text) as envelope",
        [key],
      );
      if (result.rows.length !== 1) {
        throw new Error("Could not retrieve deletion authorization.");
      }
      const envelope = result.rows[0]?.envelope;
      if (envelope === null) return null;
      if (typeof envelope !== "string" || !envelope || envelope.length > 4096) {
        throw new Error("Invalid stored deletion authorization.");
      }
      return envelope;
    },
  };
}
