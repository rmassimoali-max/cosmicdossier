/**
 * Server-only same-origin guard for future sensitive account POST endpoints.
 * A route must pass the actual request Origin and Host headers, obtained from
 * the server request, not values supplied in JSON by the browser.
 *
 * This is one CSRF defense, not a replacement for session validation,
 * fresh reauthentication, or a session-bound CSRF token where required.
 */
export function requireDeletionRequestOrigin(input: {
  method: string;
  origin: string | null;
  host: string | null;
  forwardedHost?: string | null;
  expectedOrigin: string;
}) {
  if (input.method !== "POST") {
    throw new Error("Deletion verification requires POST.");
  }

  let expected: URL;
  let actual: URL;
  try {
    expected = new URL(input.expectedOrigin);
    actual = new URL(input.origin ?? "");
  } catch {
    throw new Error("Deletion verification request origin is invalid.");
  }

  if (
    !["https:", "http:"].includes(expected.protocol) ||
    expected.username ||
    expected.password ||
    expected.pathname !== "/" ||
    expected.search ||
    expected.hash ||
    expected.origin !== input.expectedOrigin ||
    actual.origin !== expected.origin ||
    actual.username ||
    actual.password ||
    actual.pathname !== "/" ||
    actual.search ||
    actual.hash ||
    input.origin !== actual.origin
  ) {
    throw new Error("Deletion verification request origin is not allowed.");
  }

  // Never trust forwarded headers as an authorization source. The configured
  // canonical origin is authoritative, and Host must agree with it.
  if (input.host !== expected.host) {
    throw new Error("Deletion verification request host is not allowed.");
  }
  return true;
}
