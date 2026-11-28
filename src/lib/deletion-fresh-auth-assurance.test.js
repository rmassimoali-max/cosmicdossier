import { expect, test } from "bun:test";
import { meetsPasswordOnlyAssurance } from "./deletion-fresh-auth-assurance.server";

test("password-only assurance requires explicit absence of verified factors", () => {
  expect(meetsPasswordOnlyAssurance({ aal: "aal1", hasVerifiedFactors: false })).toBe(true);
});

test("unknown assurance or MFA state cannot authorize password-only flow", () => {
  for (const aal of ["aal1", "aal2", undefined, null, "unknown"]) {
    for (const hasVerifiedFactors of [true, false, undefined, null, "false"]) {
      if (aal === "aal1" && hasVerifiedFactors === false) continue;
      expect(meetsPasswordOnlyAssurance({ aal, hasVerifiedFactors })).toBe(false);
    }
  }
});
