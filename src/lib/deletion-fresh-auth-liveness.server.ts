import type { resolveFreshAuthPasswordEvidence } from "./deletion-fresh-auth-session.server";

type PasswordEvidence = Awaited<ReturnType<typeof resolveFreshAuthPasswordEvidence>>;

// A separate trusted capability must check current provider session state.
// Token validity alone is not sufficient. No production adapter is wired here.
export async function requireActiveFreshAuthSession(
  evidence: PasswordEvidence,
  isActive: (identity: { userId: string; sessionId: string }) => Promise<boolean>,
): Promise<PasswordEvidence> {
  const active = await isActive({ userId: evidence.userId, sessionId: evidence.sessionId });
  if (active !== true) {
    throw new Error("Authentication session is not active.");
  }
  return evidence;
}
