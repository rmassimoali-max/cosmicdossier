/**
 * Server-only account identity gate for future deletion verification routes.
 * The caller MUST fetch this payload from Supabase Auth /user using the
 * authenticated access token. Never pass client-supplied profile data here.
 */
export function requireVerifiedDeletionIdentity(payload: Record<string, unknown>) {
  const id = payload["id"];
  const email = payload["email"];
  const confirmedAt = payload["email_confirmed_at"];
  const isAnonymous = payload["is_anonymous"];
  const validId =
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const validEmail =
    typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (
    !validId ||
    !validEmail ||
    typeof confirmedAt !== "string" ||
    !Number.isFinite(Date.parse(confirmedAt)) ||
    isAnonymous === true
  ) {
    throw new Error("A signed-in account with a confirmed email is required.");
  }
  return { userId: id as string, verifiedEmail: email as string };
}
