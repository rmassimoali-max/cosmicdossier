import { readVerifiedFactorState } from "./deletion-fresh-auth-factors.server";

// Only verified token claims and trusted current factor state may reach this gate.
// Initially support password-only accounts; MFA requires a separate fresh proof.
export function meetsPasswordOnlyAssurance(input: {
  aal: unknown;
  hasVerifiedFactors: unknown;
}): boolean {
  return input.aal === "aal1" && input.hasVerifiedFactors === false;
}

/** Both inputs must originate from trusted provider verification, not request JSON. */
export function meetsVerifiedPasswordAssurance(aal: unknown, factors: unknown): boolean {
  return meetsPasswordOnlyAssurance({ aal, hasVerifiedFactors: readVerifiedFactorState(factors) });
}
