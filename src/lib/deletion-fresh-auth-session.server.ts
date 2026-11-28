import { readFreshAuthPasswordEvent } from "./deletion-fresh-auth-amr.server";
import { resolveDeletionIdentity } from "./deletion-auth.server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the original session for flow issuance only.
 * Supabase must validate the exact token before its claims are inspected.
 * This is not proof of recent authentication or sufficient assurance.
 */
async function resolveVerifiedSessionClaims(
  input: Parameters<typeof resolveDeletionIdentity>[0],
) {
  const identity = await resolveDeletionIdentity(input);
  const parts = input.accessToken.split(".");
  if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) {
    throw new Error("Invalid authentication session.");
  }
  const payload = parts[1];
  if (!payload) throw new Error("Invalid authentication session.");
  let claims: Record<string, unknown>;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new Error("Invalid claims.");
    }
    claims = decoded as Record<string, unknown>;
  } catch {
    throw new Error("Invalid authentication session.");
  }
  const sessionId = claims["session_id"];
  if (
    claims["sub"] !== identity.userId ||
    typeof sessionId !== "string" ||
    !uuid.test(sessionId) ||
    typeof claims["exp"] !== "number" ||
    !Number.isSafeInteger(claims["exp"]) ||
    claims["exp"] <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Invalid authentication session.");
  }
  return { userId: identity.userId, sessionId, claims };
}

export async function resolveFreshAuthOriginalSession(
  input: Parameters<typeof resolveDeletionIdentity>[0],
) {
  const { userId, sessionId } = await resolveVerifiedSessionClaims(input);
  return { userId, sessionId };
}

/** Candidate evidence only; liveness, correlation and assurance remain separate gates. */
export async function resolveFreshAuthPasswordEvidence(
  input: Parameters<typeof resolveDeletionIdentity>[0],
) {
  const { userId, sessionId, claims } = await resolveVerifiedSessionClaims(input);
  const authenticatedAt = readFreshAuthPasswordEvent(claims["amr"]);
  if (authenticatedAt === null || authenticatedAt > Date.now()) {
    throw new Error("Invalid password authentication evidence.");
  }
  return { userId, sessionId, authenticatedAt, method: "password" as const };
}
