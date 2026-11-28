import { expect, test } from "bun:test";
import { createSessionValidityCheck } from "./deletion-fresh-auth-session-validity.server";

const identity = { userId: "user", sessionId: "session" };
const state = {
  ...identity,
  now: 1,
  createdAt: 1000,
  lastActivityAt: 2000,
  notAfter: 4000,
  maximumLifetimeMs: null,
  inactivityTimeoutMs: null,
  singleSessionPolicySatisfied: true,
};

test("validity binds provider state to the exact identity and server clock", async () => {
  const check = createSessionValidityCheck({
    readState: async (requested) => {
      expect(requested).toEqual(identity);
      return state;
    },
    now: () => 3000,
  });
  expect(await check(identity)).toBe(true);
});

test("missing, mismatched or expired provider state cannot pass", async () => {
  for (const result of [
    null,
    { ...state, userId: "other" },
    { ...state, sessionId: "other" },
    { ...state, notAfter: 3000 },
    { ...state, singleSessionPolicySatisfied: false },
  ]) {
    const check = createSessionValidityCheck({
      readState: async () => result,
      now: () => 3000,
    });
    expect(await check(identity)).toBe(false);
  }
});

test("provider failure prevents approval", async () => {
  const check = createSessionValidityCheck({
    readState: async () => {
      throw new Error("Unavailable");
    },
    now: () => 3000,
  });
  await expect(check(identity)).rejects.toThrow();
});
