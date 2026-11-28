/**
 * Parse only already-verified provider claims. This does not verify a JWT,
 * establish session liveness, correlate a flow, or authorize deletion.
 * Initially support password events only; email flows require separate review.
 */
export function readFreshAuthPasswordEvent(amr: unknown): number | null {
  if (!Array.isArray(amr) || amr.length !== 1) return null;
  const entry: unknown = amr[0];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const claims = entry as Record<string, unknown>;
  const timestamp = claims["timestamp"];
  if (
    claims["method"] !== "password" ||
    typeof timestamp !== "number" ||
    !Number.isSafeInteger(timestamp) ||
    timestamp <= 0 ||
    !Number.isSafeInteger(timestamp * 1000)
  ) {
    return null;
  }
  return timestamp * 1000;
}
