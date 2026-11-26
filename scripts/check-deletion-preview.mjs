// Temporary read-only diagnostic; never runs in production or other branches.
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
      url.hostname !== "db.umcpchdifhxhxvhnatxo.supabase.co" ||
      url.username !== "deletion_worker" ||
      !url.password ||
      url.pathname !== "/postgres" ||
      url.port !== "5432" ||
      url.search !== "?sslmode=verify-full" ||
      url.hash
    ) {
      throw new Error("configuration");
    }
    url.search = "";
    stage = "connection";
    sql = postgres(url.toString(), {
      ssl: { rejectUnauthorized: true },
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
        and not has_table_privilege(current_user, 'auth.users', 'DELETE')
        and not has_table_privilege(session_user, 'auth.users', 'DELETE') as allowed`;
    });
    console.log(result[0]?.allowed === true ? "Deletion preview diagnostic: PASS" : "Deletion preview diagnostic: permission check failed");
  } catch (error) {
    const known = ["ENETUNREACH", "EHOSTUNREACH", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "CONNECT_TIMEOUT", "28P01", "28000", "42501", "CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "ERR_TLS_CERT_ALTNAME_INVALID"];
    const code = known.includes(error?.code) ? error.code : "OTHER";
    console.log(`Deletion preview diagnostic: failed at ${stage} (${code})`);
  } finally {
    if (sql) await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}
