import { expect, test } from "bun:test";
import { meetsFreshAuthPolicy } from "./deletion-fresh-auth-policy.server";

const flow = {
  userId: "owner",
  originalSessionId: "old",
  browserBinding: "binding",
  startedAt: 1000,
  expiresAt: 11000,
};
const verified = {
  userId: "owner",
  sessionId: "new",
  authenticatedAt: 2000,
  method: "password",
  browserBinding: "binding",
  correlated: true,
  assuranceSatisfied: true,
};

test("accepts correlated fresh password and email sign-in policy inputs", () => {
  expect(meetsFreshAuthPolicy({ flow, verified, now: 3000 })).toBe(true);
  expect(meetsFreshAuthPolicy({ flow, verified: { ...verified, method: "email" }, now: 3000 })).toBe(
    true,
  );
});

test("rejects wrong account, session, browser, method, timing and assurance", () => {
  for (const patch of [
    { userId: "other" },
    { sessionId: "old" },
    { browserBinding: "other" },
    { method: "refresh" },
    { authenticatedAt: 999 },
    { authenticatedAt: 3001 },
    { authenticatedAt: NaN },
    { correlated: false },
    { assuranceSatisfied: false },
  ]) {
    expect(meetsFreshAuthPolicy({ flow, verified: { ...verified, ...patch }, now: 3000 })).toBe(
      false,
    );
  }
  expect(meetsFreshAuthPolicy({ flow, verified, now: 11000 })).toBe(false);
});
