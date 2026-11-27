import postgres from "postgres";
import { openDevelopmentDeletionConnection } from "./deletion-connection.server";

/** Preview-only driver. No connection is opened when the gate is disabled. */
export function openDeletionPostgres(env: Record<string, string | undefined>) {
  return openDevelopmentDeletionConnection({
    env,
    connect: async (options) => {
      const url = new URL(options.connectionString);
      // Pass TLS options explicitly rather than letting URL options override them.
      url.search = "";
      const sql = postgres(url.toString(), {
        ssl: options.ssl,
        max: options.max,
        connect_timeout: options.connectionTimeoutMillis / 1000,
        idle_timeout: 10,
        prepare: false,
        connection: {
          statement_timeout: options.statement_timeout,
        },
      });
      try {
        await sql`select 1`;
      } catch {
        await sql.end({ timeout: 1 }).catch(() => undefined);
        throw new Error("Deletion database connection unavailable.");
      }
      return {
        async query<T extends Record<string, unknown>>(
          statement: string,
          params: readonly unknown[],
        ) {
          // Only the server-owned SQL adapters supply statements.
          // Reject unsupported parameter types rather than coercing arbitrary objects.
          const bound = params.map((value) => {
            // Challenge expiry is supplied as a Date by the trusted store.
            if (value instanceof Date && Number.isFinite(value.getTime())) {
              return value.toISOString();
            }
            if (
              value === null ||
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              return value;
            }
            throw new Error("Unsupported deletion SQL parameter.");
          });
          try {
            const rows = await sql.begin(async (transaction) => {
              // Switch roles only within the transaction, not at pooler startup.
              await transaction`set local role deletion_backend`;
              return await transaction.unsafe<T[]>(statement, bound);
            });
            return { rows: Array.from(rows) };
          } catch {
            throw new Error("Deletion database operation unavailable.");
          }
        },
        async close() {
          await sql.end({ timeout: 1 });
        },
      };
    },
  });
}
