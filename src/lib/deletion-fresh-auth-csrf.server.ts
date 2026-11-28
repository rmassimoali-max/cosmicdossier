import { createHmac, timingSafeEqual } from "node:crypto";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hex = /^[0-9a-f]{64}$/;

// Use a dedicated server secret and provider-verified session identity.
// Tokens are session-scoped, not single-use authorization credentials.
export function createFreshAuthCsrf(input: { key: string; userId: string; sessionId: string }) {
  if (!hex.test(input.key) || !uuid.test(input.userId) || !uuid.test(input.sessionId)) {
    throw new Error("Invalid fresh authentication CSRF configuration.");
  }
  const token = createHmac("sha256", Buffer.from(input.key, "hex"))
    .update("deletion-fresh-auth-csrf:v1:" + input.userId + ":" + input.sessionId)
    .digest("hex");

  return {
    token,
    async verify(candidate: string): Promise<boolean> {
      return (
        hex.test(candidate) &&
        timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(token, "hex"))
      );
    },
  };
}
