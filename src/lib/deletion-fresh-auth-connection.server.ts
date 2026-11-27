import type { DeletionSqlExecutor } from "./deletion-store.server";

type Connection = DeletionSqlExecutor & { close(): Promise<void> };
type Connect = (options: {
  connectionString: string;
  ssl: { rejectUnauthorized: true; ca: string };
  max: number;
  connectionTimeoutMillis: number;
  statement_timeout: number;
}) => Promise<Connection>;

/** Development-only connection boundary. Driver injection is intentional. */
export async function openDevelopmentFreshAuthConnection(input: {
  env: Record<string, string | undefined>;
  connect: Connect;
}): Promise<Connection | null> {
  if (input.env["ACCOUNT_DELETION_FRESH_AUTH_ENABLED"] !== "true") return null;
  if (input.env["VERCEL_ENV"] !== "preview") {
    throw new Error("Fresh-auth connection requires an isolated preview.");
  }
  const raw = input.env["DELETION_FRESH_AUTH_DATABASE_URL"];
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    throw new Error("Invalid fresh-auth database configuration.");
  }
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "aws-1-us-east-2.pooler.supabase.com" ||
    url.username !== "deletion_fresh_auth_worker.umcpchdifhxhxvhnatxo" ||
    !url.password ||
    url.pathname !== "/postgres" ||
    (url.port !== "" && url.port !== "5432") ||
    url.hash ||
    url.search !== "?sslmode=verify-full"
  ) {
    throw new Error("Fresh-auth connection requires the dedicated development identity.");
  }
  const ca = input.env["DELETION_FRESH_AUTH_DATABASE_CA"];
  if (
    !ca?.startsWith("-----BEGIN CERTIFICATE-----") ||
    !ca.trimEnd().endsWith("-----END CERTIFICATE-----")
  ) {
    throw new Error("Fresh-auth database CA is not configured.");
  }
  let db: Connection | undefined;
  try {
    db = await input.connect({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true, ca },
      max: 1,
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
    });
    const result = await db.query<{ allowed: boolean }>(
      "select current_user = 'deletion_fresh_auth_backend' and session_user = 'deletion_fresh_auth_worker' and not exists (select 1 from pg_catalog.pg_roles r where r.rolname not in (current_user, session_user) and (pg_has_role(session_user, r.oid, 'MEMBER') or pg_has_role(current_user, r.oid, 'MEMBER'))) and not exists (select 1 from pg_catalog.pg_roles where rolname in (current_user, session_user) and (rolsuper or rolcreaterole or rolcreatedb or rolbypassrls or rolreplication or (rolname = current_user and rolcanlogin) or (rolname = session_user and not rolcanlogin))) and not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname in ('auth','public','private') and c.relkind in ('r','p','v','m','f') and not (n.nspname = 'private' and c.relname = 'deletion_fresh_auth_flows') and (has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_table_privilege(session_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES') or has_any_column_privilege(session_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','SELECT') and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','INSERT') and has_table_privilege(current_user,'private.deletion_fresh_auth_flows','DELETE') and not has_table_privilege(current_user,'private.deletion_fresh_auth_flows','UPDATE,TRUNCATE,REFERENCES,TRIGGER') and not has_any_column_privilege(current_user,'private.deletion_fresh_auth_flows','UPDATE,REFERENCES') and not has_table_privilege(session_user,'private.deletion_fresh_auth_flows','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') and not has_any_column_privilege(session_user,'private.deletion_fresh_auth_flows','SELECT,INSERT,UPDATE,REFERENCES') and exists (select 1 from pg_catalog.pg_class c where c.oid = 'private.deletion_fresh_auth_flows'::regclass and c.relrowsecurity and c.relowner not in (select oid from pg_catalog.pg_roles where rolname in (current_user,session_user))) and has_function_privilege(current_user, 'private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid)', 'EXECUTE') and has_function_privilege(current_user, 'private.take_deletion_fresh_auth_flow(text,text)', 'EXECUTE') and not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and (has_function_privilege(session_user,p.oid,'EXECUTE') or (has_function_privilege(current_user,p.oid,'EXECUTE') and p.oid not in ('private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid)'::regprocedure,'private.take_deletion_fresh_auth_flow(text,text)'::regprocedure)))) and not has_function_privilege(current_user, 'private.cleanup_deletion_fresh_auth_flows()', 'EXECUTE') as allowed",
      [],
    );
    if (result.rows.length !== 1 || result.rows[0]?.allowed !== true) {
      throw new Error("Unexpected fresh-auth database identity.");
    }
    return db;
  } catch {
    if (db) {
      try {
        await db.close();
      } catch {
        // Do not expose driver errors or connection details.
      }
    }
    throw new Error("Fresh-auth database connection unavailable.");
  }
}
