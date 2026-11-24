import { readDeletionCodeSecret } from "./deletion-code.server";
import { readDeletionEmailConfig } from "./deletion-email.server";

/**
 * Deliberately not a database connection factory. An independently reviewed
 * server-only PostgreSQL driver must be supplied before enabling any route.
 * Never accept a Supabase REST URL or a browser-exposed environment variable.
 */
export function readDeletionBackendConfig(env: Record<string, string | undefined>) {
  if (env["ACCOUNT_DELETION_BACKEND_ENABLED"] !== "true") return null;

  const url = env["DELETION_DATABASE_URL"];
  if (!url) throw new Error("Deletion database connection is not configured.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid deletion database connection URL.");
  }
  if (
    parsed.protocol !== "postgresql:" ||
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    parsed.hash ||
    parsed.searchParams.get("sslmode") !== "verify-full" ||
    [...parsed.searchParams.keys()].some((key) => key !== "sslmode")
  ) {
    throw new Error("Deletion database connection must use a dedicated PostgreSQL URL.");
  }
  if (
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1"
  ) {
    throw new Error("Deletion backend cannot use a local database when enabled.");
  }
  const email = readDeletionEmailConfig(env);
  const secret = readDeletionCodeSecret(env);
  if (!email || !secret) {
    throw new Error("Deletion email and independent HMAC secret must be configured.");
  }
  return { databaseUrl: url, email, secret };
}
