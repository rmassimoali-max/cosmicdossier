import { expect, test } from "bun:test";
import { createProviderSessionCheck } from "./deletion-fresh-auth-session-provider.server";

const identity = { userId: "user", sessionId: "session" };
const session = { ...identity, createdAt: 1000, lastActivityAt: 2000, notAfter: null };
const config = {
  maximumLifetime: { enabled: true, milliseconds: 3000 },
  inactivityTimeout: { enabled: true, milliseconds: 2000 },
  singleSessionEnabled: false,
};

test("combines explicit provider policy with matching session metadata", async () => {
  const check = createProviderSessionCheck({
    readSession: async () => session,
    readConfig: async () => config,
    now: () => 3000,
  });
  expect(await check(identity)).toBe(true);
});

test("unknown configuration prevents session lookup and approval", async () => {
  const check = createProviderSessionCheck({
    readSession: async () => {
      throw new Error("Unexpected lookup");
    },
    readConfig: async () => null,
    now: () => 3000,
  });
  expect(await check(identity)).toBe(false);
});

test("missing sessions and elapsed limits reject", async () => {
  for (const state of [null, session]) {
    const check = createProviderSessionCheck({
      readSession: async () => state,
      readConfig: async () => config,
      now: () => 4000,
    });
    expect(await check(identity)).toBe(false);
  }
});
