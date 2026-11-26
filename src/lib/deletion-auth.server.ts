import { requireVerifiedDeletionIdentity } from "./deletion-identity.server";

/**
 * Resolve deletion identity from Supabase Auth, not from client-provided
 * user IDs, email addresses, or decoded JWT claims.
 * This helper is server-only and does not initiate deletion.
 */
export async function resolveDeletionIdentity(input: {
  authUrl: string;
  publishableKey: string;
  accessToken: string;
  fetcher?: typeof fetch;
}) {
  const { authUrl, publishableKey, accessToken } = input;
  if (
    !/^https:\/\//.test(authUrl) ||
    !publishableKey ||
    !accessToken ||
    /[\r\n]/.test(publishableKey) ||
    /[\r\n]/.test(accessToken)
  ) {
    throw new Error("A valid authenticated session is required.");
  }

  let url: URL;
  try {
    url = new URL("/auth/v1/user", authUrl);
  } catch {
    throw new Error("Authentication service is not configured.");
  }

  const response = await (input.fetcher ?? fetch)(url.toString(), {
    method: "GET",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not verify your current account.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Could not verify your current account.");
  }
  return requireVerifiedDeletionIdentity(payload as Record<string, unknown>);
}
