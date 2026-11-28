import { meetsSessionExpiryPolicy } from "./deletion-fresh-auth-session-expiry.server";

type Identity = { userId: string; sessionId: string };
type Timing = Parameters<typeof meetsSessionExpiryPolicy>[0];

// Only trusted server adapters may supply these capabilities.
// No provider adapter or live endpoint is configured here.
export function createSessionValidityCheck(input: {
  readState: (identity: Identity) => Promise<(Timing & Identity) | null>;
  now: () => number;
}) {
  return async (identity: Identity): Promise<boolean> => {
    const state = await input.readState(identity);
    if (!state || state.userId !== identity.userId || state.sessionId !== identity.sessionId) {
      return false;
    }
    return meetsSessionExpiryPolicy({ ...state, now: input.now() });
  };
}
