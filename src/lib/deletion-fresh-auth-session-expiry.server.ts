// Staged policy only. Inputs must come from trusted provider state and configuration.
// Unknown provider policy, including single-session enforcement, must fail closed.
export function meetsSessionExpiryPolicy(input: {
  now: number;
  createdAt: number;
  lastActivityAt: number;
  notAfter: number | null;
  maximumLifetimeMs: number | null;
  inactivityTimeoutMs: number | null;
  singleSessionPolicySatisfied: boolean;
}): boolean {
  const { now, createdAt, lastActivityAt, notAfter, maximumLifetimeMs, inactivityTimeoutMs } = input;
  const validTime = (value: number) => Number.isSafeInteger(value) && value > 0;
  if (
    !validTime(now) ||
    !validTime(createdAt) ||
    !validTime(lastActivityAt) ||
    createdAt > lastActivityAt ||
    lastActivityAt > now ||
    input.singleSessionPolicySatisfied !== true
  ) {
    return false;
  }
  if (notAfter !== null && (!validTime(notAfter) || now >= notAfter)) return false;
  if (
    maximumLifetimeMs !== null &&
    (!validTime(maximumLifetimeMs) || now - createdAt >= maximumLifetimeMs)
  ) {
    return false;
  }
  if (
    inactivityTimeoutMs !== null &&
    (!validTime(inactivityTimeoutMs) || now - lastActivityAt >= inactivityTimeoutMs)
  ) {
    return false;
  }
  return true;
}
