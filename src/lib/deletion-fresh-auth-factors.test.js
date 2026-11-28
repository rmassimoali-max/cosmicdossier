import { expect, test } from "bun:test";
import { readVerifiedFactorState } from "./deletion-fresh-auth-factors.server";

test("complete inventories distinguish verified and unverified factors", () => {
  expect(readVerifiedFactorState([])).toBe(false);
  expect(readVerifiedFactorState([{ status: "unverified" }])).toBe(false);
  expect(readVerifiedFactorState([{ status: "verified" }])).toBe(true);
  expect(readVerifiedFactorState([{ status: "unverified" }, { status: "verified" }])).toBe(true);
});

test("missing or malformed inventories cannot establish MFA state", () => {
  for (const factors of [
    undefined,
    null,
    {},
    [null],
    [{}],
    [{ status: "unknown" }],
    [{ status: "verified" }, {}],
  ]) {
    expect(readVerifiedFactorState(factors)).toBeNull();
  }
});
