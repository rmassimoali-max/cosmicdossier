import { expect, test } from "bun:test";
import { meetsSessionExpiryPolicy } from "./deletion-fresh-auth-session-expiry.server";

const valid = {
  now: 10000,
  createdAt: 1000,
  lastActivityAt: 9000,
  notAfter: 11000,
  maximumLifetimeMs: 10000,
  inactivityTimeoutMs: 2000,
  singleSessionPolicySatisfied: true,
};

test("known valid session timing passes", () => {
  expect(meetsSessionExpiryPolicy(valid)).toBe(true);
});

test("expiration boundaries reject even when the session exists", () => {
  for (const override of [
    { notAfter: 10000 },
    { maximumLifetimeMs: 9000 },
    { inactivityTimeoutMs: 1000 },
    { singleSessionPolicySatisfied: false },
  ]) {
    expect(meetsSessionExpiryPolicy({ ...valid, ...override })).toBe(false);
  }
});

test("unknown or malformed policy values fail closed", () => {
  for (const override of [
    { now: NaN },
    { createdAt: 10001 },
    { lastActivityAt: 10001 },
    { notAfter: undefined },
    { maximumLifetimeMs: undefined },
    { inactivityTimeoutMs: 0 },
    { singleSessionPolicySatisfied: undefined },
  ]) {
    expect(meetsSessionExpiryPolicy({ ...valid, ...override })).toBe(false);
  }
});

test("explicitly disabled time limits are accepted", () => {
  expect(
    meetsSessionExpiryPolicy({
      ...valid,
      notAfter: null,
      maximumLifetimeMs: null,
      inactivityTimeoutMs: null,
    }),
  ).toBe(true);
});
