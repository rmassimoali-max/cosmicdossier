import type { DeletionChallengeStore } from "./deletion-request.server";

/**
 * A server-only SQL boundary. The caller must provide a privileged, isolated
 * PostgreSQL connection, never a browser or PostgREST client.
 * Parameter arrays MUST be bound by the database driver, never interpolated.
 */
export type DeletionSqlExecutor = {
  query<T extends Record<string, unknown>>(
    statement: string,
    params: readonly unknown[],
  ): Promise<{ rows: T[] }>;
};

export function createDeletionChallengeStore(db: DeletionSqlExecutor): DeletionChallengeStore {
  return {
    async create({ id, userId, tokenHash, expiresAt }) {
      const result = await db.query<{ issued: boolean }>(
        "select private.issue_account_deletion_challenge($1::uuid, $2::uuid, $3::text, $4::timestamptz) as issued",
        [id, userId, tokenHash, expiresAt],
      );
      if (result.rows.length !== 1 || result.rows[0]?.issued !== true) {
        throw new Error("Deletion verification request is unavailable. Please try again later.");
      }
    },
    async revoke(id, userId) {
      const result = await db.query<{ id: string }>(
        "update public.account_deletion_challenges set consumed_at = clock_timestamp() where id = $1::uuid and user_id = $2::uuid and consumed_at is null returning id",
        [id, userId],
      );
      if (result.rows.length !== 1 || result.rows[0]?.id !== id) {
        throw new Error("Could not revoke deletion verification challenge.");
      }
    },
  };
}
