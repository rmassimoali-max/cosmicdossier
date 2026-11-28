import postgres from "postgres";
import { openDevelopmentFreshAuthConnection } from "./deletion-fresh-auth-connection.server";

/** Preview-only driver. No connection is opened when the gate is disabled. */
export function openFreshAuthPostgres(env: Record<string, string | undefined>) {
  return openDevelopmentFreshAuthConnection({
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
        throw new Error("Fresh-auth database connection unavailable.");
      }
      return {
        async query<T extends Record<string, unknown>>(
          statement: string,
          params: readonly unknown[],
        ) {
          // Permit only the exact identity and storage statements.
          const allowed = new Map<string, number>([
            [
              "select current_user = 'deletion_fresh_auth_backend' and session_user = 'deletion_fresh_auth_worker' and not exists (select 1 from pg_catalog.pg_roles r where r.rolname not in (current_user, session_user) and (pg_has_role(session_user, r.oid, 'MEMBER') or pg_has_role(current_user, r.oid, 'MEMBER'))) and not exists (select 1 from pg_catalog.pg_roles where rolname in (current_user, session_user) and (rolsuper or rolcreaterole or rolcreatedb or rolbypassrls or rolreplication or (rolname = current_user and rolcanlogin) or (rolname = session_user and not rolcanlogin))) and not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname in ('auth','public','private') and c.relkind in ('r','p','v','m','f') and not (n.nspname = 'private' and c.relname = 'deletion_fresh_auth_flows') and (has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_table_privilege(session_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES') or has_any_column_privilege(session_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','SELECT') and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','INSERT') and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','DELETE') and not has_table_privilege(current_user,'private.deletion_fresh_auth_flows','UPDATE,TRUNCATE,REFERENCES,TRIGGER') and not has_any_column_privilege(current_user,'private.deletion_fresh_auth_flows','UPDATE,REFERENCES') and not has_table_privilege(session_user,'private.deletion_fresh_auth_flows','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') and not has_any_column_privilege(session_user,'private.deletion_fresh_auth_flows','SELECT,INSERT,UPDATE,REFERENCES') and exists (select 1 from pg_catalog.pg_class c where c.oid = 'private.deletion_fresh_auth_flows'::regclass and c.relrowsecurity and c.relowner not in (select oid from pg_catalog.pg_roles where rolname in (current_user,session_user))) and has_function_privilege(current_user, 'private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid)', 'EXECUTE') and has_function_privilege(current_user, 'private.take_deletion_fresh_auth_flow(text,text)', 'EXECUTE') and not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and (has_function_privilege(session_user,p.oid,'EXECUTE') or (has_function_privilege(current_user,p.oid,'EXECUTE') and p.oid not in ('private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid)'::regprocedure,'private.take_deletion_fresh_auth_flow(text,text)'::regprocedure)))) and not has_function_privilege(current_user, 'private.cleanup_deletion_fresh_auth_flows()', 'EXECUTE') as allowed",
              0,
            ],
            [
              "select private.issue_deletion_fresh_auth_flow($1::text, $2::text, $3::uuid, $4::uuid) as issued",
              4,
            ],
            [
              "select user_id, original_session_id, floor(extract(epoch from started_at)*1000)::text as started_ms, floor(extract(epoch from expires_at)*1000)::text as expires_ms from private.take_deletion_fresh_auth_flow($1::text, $2::text)",
              2,
            ],
          ]);
          if (allowed.get(statement) !== params.length) {
            throw new Error("Unsupported fresh-auth SQL statement.");
          }
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
            throw new Error("Unsupported fresh-auth SQL parameter.");
          });
          try {
            const rows = await sql.begin(async (transaction) => {
              // Switch roles only within the transaction, not at pooler startup.
              await transaction`set local role deletion_fresh_auth_backend`;
              return await transaction.unsafe<T[]>(statement, bound);
            });
            return { rows: Array.from(rows) };
          } catch {
            throw new Error("Fresh-auth database operation unavailable.");
          }
        },
        async close() {
          await sql.end({ timeout: 1 });
        },
      };
    },
  });
}
