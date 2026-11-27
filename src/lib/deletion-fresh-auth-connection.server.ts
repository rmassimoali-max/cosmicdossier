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
      "select current_user = 'deletion_fresh_auth_backend' and session_user = 'deletion_fresh_auth_worker' and not pg_has_role(session_user, 'deletion_backend', 'MEMBER') and not pg_has_role(session_user, 'deletion_worker', 'MEMBER') and not pg_has_role(current_user, 'deletion_backend', 'MEMBER') and not pg_has_role(current_user, 'deletion_worker', 'MEMBER') and not exists (select 1 from pg_catalog.pg_roles where rolname in (current_user, session_user) and (rolsuper or rolcreaterole or rolcreatedb or rolbypassrls)) and not has_table_privilege(current_user, 'auth.users', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and not has_table_privilege(current_user, 'auth.sessions', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and not has_table_privilege(current_user, 'private.deletion_session_authorizations', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and not has_table_privilege(current_user, 'public.account_deletion_authorizations', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and not has_table_privilege(current_user, 'public.account_deletion_challenges', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and has_function_privilege(current_user, 'private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid)', 'EXECUTE') and has_function_privilege(current_user, 'private.take_deletion_fresh_auth_flow(text,text)', 'EXECUTE') and not has_function_privilege(current_user, 'private.cleanup_deletion_fresh_auth_flows()', 'EXECUTE') as allowed",
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
