import { readDeletionBackendConfig } from "./deletion-backend-config.server";
import { resolveDeletionIdentity } from "./deletion-auth.server";
import { requireDeletionRequestOrigin } from "./deletion-origin.server";

/**
 * Server-only preflight for future deletion-verification POST routes.
 * A route must supply trusted request headers, HttpOnly cookie token and
 * server environment, never values taken from request JSON.
 *
 * This is deliberately NOT a route or database connection and cannot delete.
 * A future route also needs fresh reauthentication and approved CSRF handling.
 */
export async function requireDeletionVerificationPreflight(input: {
  env: Record<string, string | undefined>;
  method: string;
  origin: string | null;
  host: string | null;
  expectedOrigin: string;
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  fetcher?: typeof fetch;
}) {
  const backend = readDeletionBackendConfig(input.env);
  if (!backend) {
    throw new Error("Account deletion verification is not enabled.");
  }
  requireDeletionRequestOrigin({
    method: input.method,
    origin: input.origin,
    host: input.host,
    expectedOrigin: input.expectedOrigin,
  });
  const identity = await resolveDeletionIdentity({
    authUrl: input.authUrl,
    publishableKey: input.publishableKey,
    accessToken: input.accessToken,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });
  return { identity, backend };
}
