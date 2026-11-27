// Temporary diagnostic with rollback-only fixtures; restricted to the development preview.
import { randomBytes } from "node:crypto";
import postgres from "postgres";

if (
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "recovery/account-deletion-staging"
) {
  let sql;
  let stage = "configuration";
  try {
    const url = new URL(process.env.DELETION_DATABASE_URL ?? "");
    if (
      url.protocol !== "postgresql:" ||
      url.hostname !== "aws-1-us-east-2.pooler.supabase.com" ||
      url.username !== "deletion_worker.umcpchdifhxhxvhnatxo" ||
      !url.password ||
      url.pathname !== "/postgres" ||
      url.port !== "5432" ||
      url.search !== "?sslmode=verify-full" ||
      url.hash
    ) {
      throw new Error("configuration");
    }
    url.search = "";
    const ca = process.env.DELETION_DATABASE_CA;
    if (
      !ca?.startsWith("-----BEGIN CERTIFICATE-----") ||
      !ca.trimEnd().endsWith("-----END CERTIFICATE-----")
    ) {
      throw new Error("configuration");
    }
    stage = "connection";
    sql = postgres(url.toString(), {
      ssl: { rejectUnauthorized: true, ca },
      max: 1,
      connect_timeout: 5,
      prepare: false,
      connection: { statement_timeout: 5000 },
    });
    const result = await sql.begin(async (tx) => {
      stage = "transaction";
      await tx`set transaction read only`;
      stage = "role";
      await tx`set local role deletion_backend`;
      stage = "permissions";
      return tx`select current_user = 'deletion_backend'
        and session_user = 'deletion_worker'
        and has_table_privilege(current_user, 'private.deletion_session_authorizations', 'SELECT')
        and not has_table_privilege(current_user, (select c.oid from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and c.relname = 'users'), 'DELETE')
        and not has_table_privilege(session_user, (select c.oid from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and c.relname = 'users'), 'DELETE') as allowed`;
    });
    if (result[0]?.allowed !== true) throw new Error("permissions");
    console.log("Deletion preview diagnostic: PASS");
    stage = "storage";
    const a = randomBytes(32).toString("hex");
    const b = randomBytes(32).toString("hex");
    const rollback = new Error("intentional rollback");
    try {
      await sql.begin(async (tx) => {
        await tx`set local role deletion_backend`;
        const put = async (slot, envelope, ttl) => {
          const [row] = await tx`select private.put_deletion_session_authorization(${slot}, ${envelope}, ${ttl}) as ok`;
          return row?.ok;
        };
        const take = async (slot) => {
          const [row] = await tx`select private.take_deletion_session_authorization(${slot}) as value`;
          return row?.value;
        };
        if (!(await put(a, "fixture-a", 240000)) || !(await put(b, "fixture-b", 240000))) {
          throw new Error("storage write");
        }
        if ((await put(a, "invalid", 240001)) !== false) throw new Error("invalid TTL");
        if ((await take(a)) !== "fixture-a" || (await take(a)) !== null) {
          throw new Error("single use");
        }
        if ((await take(b)) !== "fixture-b") throw new Error("isolation");
        if (!(await put(a, "expired", 240000))) throw new Error("expiry fixture");
        await tx`update private.deletion_session_authorizations
          set expires_at = clock_timestamp() - interval '1 second' where slot = ${a}`;
        if ((await take(a)) !== null) throw new Error("expiry");
        throw rollback;
      });
      throw new Error("missing rollback");
    } catch (error) {
      if (error !== rollback) throw error;
    }
    console.log("Deletion preview storage diagnostic: PASS (rolled back)");
  } catch (error) {
    const rawCode = error?.code;
    const code =
      typeof rawCode === "string" && /^[A-Z0-9_]{1,40}$/.test(rawCode) ? rawCode : "OTHER";
    const category = /tenant or user not found/i.test(error?.message ?? "")
      ? "pooler identity not found"
      : /password authentication failed/i.test(error?.message ?? "")
        ? "authentication rejected"
        : "unclassified";
    console.log(`Deletion preview diagnostic: failed at ${stage} (${code}; ${category})`);
  } finally {
    if (sql) await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}
