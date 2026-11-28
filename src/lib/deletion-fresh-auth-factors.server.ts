// Parse a complete factor inventory from a trusted provider response only.
// Missing inventories are unknown, not evidence that MFA is disabled.
export function readVerifiedFactorState(factors: unknown): boolean | null {
  if (!Array.isArray(factors)) return null;
  let verified = false;
  for (const factor of factors) {
    if (!factor || typeof factor !== "object" || Array.isArray(factor)) return null;
    const status: unknown = factor.status;
    if (status !== "verified" && status !== "unverified") return null;
    if (status === "verified") verified = true;
  }
  return verified;
}
