import { readSessionPolicyConfig } from "./deletion-fresh-auth-session-config.server";
import type { createSessionStateReader } from "./deletion-fresh-auth-session-state.server";
import { createSessionValidityCheck } from "./deletion-fresh-auth-session-validity.server";

// Staged composition. The configuration source must be trusted, current and
// bound to the same provider project as the session reader.
export function createProviderSessionCheck(input: {
  readSession: ReturnType<typeof createSessionStateReader>;
  readConfig: () => Promise<unknown>;
  now: () => number;
}) {
  return createSessionValidityCheck({
    now: input.now,
    async readState(identity) {
      const config = readSessionPolicyConfig(await input.readConfig());
      if (!config) return null;
      const session = await input.readSession(identity);
      if (!session) return null;
      return { ...session, ...config, now: 0 };
    },
  });
}
