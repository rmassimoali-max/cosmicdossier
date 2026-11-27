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
export async function openDevelopmentDeletionConnection(input: {
  env: Record<string, string | undefined>;
  connect: Connect;
}): Promise<Connection | null> {
  if (input.env["ACCOUNT_DELETION_BACKEND_ENABLED"] !== "true") return null;
  if (input.env["VERCEL_ENV"] !== "preview") {
    throw new Error("Deletion connection requires an isolated preview.");
  }
  const raw = input.env["DELETION_DATABASE_URL"];
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    throw new Error("Invalid deletion database configuration.");
  }
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "aws-1-us-east-2.pooler.supabase.com" ||
    url.username !== "deletion_worker.umcpchdifhxhxvhnatxo" ||
    !url.password ||
    url.pathname !== "/postgres" ||
    (url.port !== "" && url.port !== "5432") ||
    url.hash ||
    url.search !== "?sslmode=verify-full"
  ) {
    throw new Error("Deletion connection requires the dedicated development identity.");
  }
  const ca = input.env["DELETION_DATABASE_CA"];
  if (
    !ca?.startsWith("-----BEGIN CERTIFICATE-----") ||
    !ca.trimEnd().endsWith("-----END CERTIFICATE-----")
  ) {
    throw new Error("Deletion database CA is not configured.");
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
      "select current_user = 'deletion_backend' and session_user = 'deletion_worker' and not has_table_privilege(current_user, 'auth.users', 'DELETE') as allowed",
      [],
    );
    if (result.rows.length !== 1 || result.rows[0]?.allowed !== true) {
      throw new Error("Unexpected deletion database identity.");
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
    throw new Error("Deletion database connection unavailable.");
  }
}
