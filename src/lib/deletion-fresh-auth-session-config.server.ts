type Limit = { enabled: false } | { enabled: true; milliseconds: number };

function readLimit(value: unknown): number | null | undefined {
  if (!value || typeof value !== "object") return undefined;
  const limit = value as Partial<Limit> & { milliseconds?: unknown };
  if (limit.enabled === false && limit.milliseconds === undefined) return null;
  if (
    limit.enabled === true &&
    typeof limit.milliseconds === "number" &&
    Number.isSafeInteger(limit.milliseconds) &&
    limit.milliseconds > 0
  ) {
    return limit.milliseconds;
  }
  return undefined;
}

// Accept only explicit, trusted provider settings. Never read client input here.
// Single-session enforcement is not implemented, so enabled or unknown blocks use.
export function readSessionPolicyConfig(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const config = value as Record<string, unknown>;
  const maximumLifetimeMs = readLimit(config["maximumLifetime"]);
  const inactivityTimeoutMs = readLimit(config["inactivityTimeout"]);
  if (
    maximumLifetimeMs === undefined ||
    inactivityTimeoutMs === undefined ||
    config["singleSessionEnabled"] !== false
  ) {
    return null;
  }
  return { maximumLifetimeMs, inactivityTimeoutMs, singleSessionPolicySatisfied: true };
}
