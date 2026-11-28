import { expect, test } from "bun:test";
import { readFreshAuthPasswordEvent } from "./deletion-fresh-auth-amr.server";

test("password event uses the authentication timestamp in milliseconds", () => {
  expect(readFreshAuthPasswordEvent([{ method: "password", timestamp: 1700000000 }])).toBe(
    1700000000000,
  );
});

test("unsupported or ambiguous authentication methods fail closed", () => {
  for (const method of ["token_refresh", "recovery", "otp", "magiclink", "oauth", "totp"]) {
    expect(readFreshAuthPasswordEvent([{ method, timestamp: 1700000000 }])).toBeNull();
  }
  expect(
    readFreshAuthPasswordEvent([
      { method: "password", timestamp: 1700000000 },
      { method: "token_refresh", timestamp: 1700000001 },
    ]),
  ).toBeNull();
});

test("missing or malformed authentication timestamps fail closed", () => {
  for (const timestamp of [null, "1700000000", 0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER]) {
    expect(readFreshAuthPasswordEvent([{ method: "password", timestamp }])).toBeNull();
  }
  for (const value of [null, {}, [], [null], ["password"]]) {
    expect(readFreshAuthPasswordEvent(value)).toBeNull();
  }
});
