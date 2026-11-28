import { expect, test } from "bun:test";
import { consumeFreshAuthFlow } from "./deletion-fresh-auth-consume.server";

function fixture() {
  const flow = {
    userId: "owner",
    originalSessionId: "old",
    browserBinding: "browser",
    startedAt: 1000,
    expiresAt: 10000,
  };
  let remaining = flow;
  const store = {
    async take(id, binding) {
      if (id !== "flow" || binding !== "browser") return null;
      const result = remaining;
      remaining = null;
      return result;
    },
  };
  return {
    store,
    flowId: "flow",
    verified: {
      userId: "owner",
      sessionId: "new",
      browserBinding: "browser",
      authenticatedAt: 2000,
      method: "password",
      correlated: true,
      assuranceSatisfied: true,
    },
    now: () => 3000,
  };
}

test("concurrent consumption grants at most one approval with an atomic adapter", async () => {
  const input = fixture();
  const results = await Promise.all([consumeFreshAuthFlow(input), consumeFreshAuthFlow(input)]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(await consumeFreshAuthFlow(input)).toBe(false);
});

test("wrong browser cannot take the owner flow", async () => {
  const input = fixture();
  const verified = { ...input.verified, browserBinding: "other" };
  expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
  expect(await consumeFreshAuthFlow(input)).toBe(true);
});

test("invalid evidence burns a taken flow", async () => {
  const input = fixture();
  const verified = { ...input.verified, userId: "other" };
  expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
  expect(await consumeFreshAuthFlow(input)).toBe(false);
});

test("expiry is checked after storage returns", async () => {
  const input = fixture();
  expect(await consumeFreshAuthFlow({ ...input, now: () => 10000 })).toBe(false);
});

test("storage failure never grants approval", async () => {
  const input = fixture();
  const store = {
    async take() {
      throw new Error("unavailable");
    },
  };
  await expect(consumeFreshAuthFlow({ ...input, store })).rejects.toThrow("unavailable");
});

test("a refreshed token cannot approve deletion even with a new session ID", async () => {
  const input = fixture();
  const verified = { ...input.verified, method: "refresh" };
  expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
  expect(await consumeFreshAuthFlow(input)).toBe(false);
});

test("the original session cannot approve deletion", async () => {
  const input = fixture();
  const verified = { ...input.verified, sessionId: "old" };
  expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
});

test("authentication before the flow began cannot approve deletion", async () => {
  const input = fixture();
  const verified = { ...input.verified, authenticatedAt: 999 };
  expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
});

test("uncorrelated or insufficient assurance evidence cannot approve deletion", async () => {
  for (const override of [{ correlated: false }, { assuranceSatisfied: false }]) {
    const input = fixture();
    const verified = { ...input.verified, ...override };
    expect(await consumeFreshAuthFlow({ ...input, verified })).toBe(false);
  }
});
