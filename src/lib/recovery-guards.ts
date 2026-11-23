/** Recovery authorization is separate from ordinary account authentication. */
export function hasRecoveryAuthorization(accessToken: string | undefined, recoveryMarker: string | undefined): boolean {
  return Boolean(accessToken) && recoveryMarker === "1";
}

/** Only a recovery-specific OTP hash is accepted, never ordinary login tokens. */
export function recoveryTokenFromUrl(search: string, hash: string): string | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const tokenHash = query.get("token_hash") ?? fragment.get("token_hash");
  const type = query.get("type") ?? fragment.get("type");
  if (type !== "recovery" || !tokenHash || tokenHash.length < 16 || tokenHash.length > 2048) return null;
  if (query.has("access_token") || fragment.has("access_token") || query.has("refresh_token") || fragment.has("refresh_token")) return null;
  return tokenHash;
}
