// Pure policy only. Inputs must come from trusted server-side state and provider verification.
// This does not verify tokens, consume flow state, or authorize deletion.
export type FreshAuthPolicyInput = {
  flow: {
    userId: string;
    originalSessionId: string;
    browserBinding: string;
    startedAt: number;
    expiresAt: number;
  };
  verified: {
    userId: string;
    sessionId: string;
    authenticatedAt: number;
    method: "password" | "email" | "refresh";
    browserBinding: string;
    correlated: boolean;
    assuranceSatisfied: boolean;
  };
  now: number;
};

export function meetsFreshAuthPolicy({ flow, verified, now }: FreshAuthPolicyInput): boolean {
  return (
    [now, flow.startedAt, flow.expiresAt, verified.authenticatedAt].every(Number.isFinite) &&
    flow.startedAt <= now &&
    now < flow.expiresAt &&
    flow.expiresAt - flow.startedAt <= 10 * 60 * 1000 &&
    verified.authenticatedAt >= flow.startedAt &&
    verified.authenticatedAt <= now &&
    Boolean(flow.userId && flow.originalSessionId && flow.browserBinding && verified.sessionId) &&
    verified.userId === flow.userId &&
    verified.sessionId !== flow.originalSessionId &&
    verified.browserBinding === flow.browserBinding &&
    verified.correlated === true &&
    verified.assuranceSatisfied === true &&
    (verified.method === "password" || verified.method === "email")
  );
}
