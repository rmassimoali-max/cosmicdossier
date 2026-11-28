import { requireDeletionRequestOrigin } from "./deletion-origin.server";

// Staged HTTP boundary. The CSRF verifier must validate a session-bound token
// using trusted server state; the rate limiter must be persistent and atomic.
export async function requireFreshAuthRequest(input: {
  request: Request;
  expectedOrigin: string;
  verifyCsrf: (token: string) => Promise<boolean>;
  reserveAttempt: () => Promise<boolean>;
}) {
  if (!input.expectedOrigin.startsWith("https://")) {
    throw new Error("Fresh authentication requires HTTPS.");
  }
  requireDeletionRequestOrigin({
    method: input.request.method,
    origin: input.request.headers.get("origin"),
    host: input.request.headers.get("host"),
    expectedOrigin: input.expectedOrigin,
  });
  const token = input.request.headers.get("x-csrf-token");
  if (!token || !/^[0-9a-f]{64}$/.test(token) || (await input.verifyCsrf(token)) !== true) {
    throw new Error("Invalid fresh authentication request.");
  }
  if ((await input.reserveAttempt()) !== true) {
    throw new Error("Fresh authentication attempt unavailable.");
  }
}
