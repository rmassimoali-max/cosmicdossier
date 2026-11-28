import { createFreshAuthBrowserBinding } from "./deletion-fresh-auth-browser.server";
import { resolveFreshAuthOriginalSession } from "./deletion-fresh-auth-session.server";
import type { createPostgresFreshAuthStore } from "./deletion-fresh-auth-store.server";

/**
 * Staged issuance only. A future route must enforce origin, CSRF and rate limits
 * before calling this helper. Never return the binding secret in a JSON body.
 */
export async function issueFreshAuthFlow(input: {
  auth: Parameters<typeof resolveFreshAuthOriginalSession>[0];
  store: Pick<ReturnType<typeof createPostgresFreshAuthStore>, "issue">;
}) {
  const identity = await resolveFreshAuthOriginalSession(input.auth);
  const { browserBinding, setCookie } = createFreshAuthBrowserBinding();
  const flowId = await input.store.issue({ ...identity, browserBinding });
  if (!/^[0-9a-f]{64}$/.test(flowId)) {
    throw new Error("Fresh-auth issuance failed.");
  }
  return { flowId, setCookie };
}
