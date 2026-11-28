// Only verified token claims and trusted current factor state may reach this gate.
// Initially support password-only accounts; MFA requires a separate fresh proof.
export function meetsPasswordOnlyAssurance(input: {
  aal: unknown;
  hasVerifiedFactors: unknown;
}): boolean {
  return input.aal === "aal1" && input.hasVerifiedFactors === false;
}
