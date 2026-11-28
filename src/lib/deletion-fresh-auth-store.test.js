import { expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { createPostgresFreshAuthStore } from "./deletion-fresh-auth-store.server";

const key = "a".repeat(64);
const browserBinding = "b".repeat(64);
const userId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const row = {
  user_id: userId,
  original_session_id: sessionId,
  started_ms: "1000",
  expires_ms: "601000",
};

test("issue and take use bound, domain-separated hashes and preserve browser isolation", async () => {
  let stored;
  const calls = [];
  const db = {
    async query(statement, params) {
      calls.push({ statement, params });
      if (statement.includes("issue_deletion_fresh_auth_flow")) {
        stored = params;
        return { rows: [{ issued: true }] };
      }
      if (!stored || stored[0] !== params[0] || stored[1] !== params[1]) {
        return { rows: [] };
      }
      stored = undefined;
      return { rows: [row] };
    },
  };
  const store = createPostgresFreshAuthStore(db, key);
  const flowId = await store.issue({ userId, sessionId, browserBinding });
  const hash = (domain, value) =>
    createHmac("sha256", Buffer.from(key, "hex"))
      .update(domain + ":" + value)
      .digest("hex");
  expect(flowId).toMatch(/^[0-9a-f]{64}$/);
  expect(calls[0].params).toEqual([
    hash("fresh-auth-flow", flowId),
    hash("fresh-auth-browser", browserBinding),
    userId,
    sessionId,
  ]);
  expect(calls[0].statement).toContain("$1::text");
  expect(await store.take(flowId, "c".repeat(64))).toBeNull();
  expect(await store.take(flowId, browserBinding)).toEqual({
    userId,
    originalSessionId: sessionId,
    browserBinding,
    startedAt: 1000,
    expiresAt: 601000,
  });
  expect(await store.take(flowId, browserBinding)).toBeNull();
});

test("invalid inputs never reach SQL", async () => {
  const db = {
    async query() {
      throw new Error("unexpected SQL");
    },
  };
  expect(() => createPostgresFreshAuthStore(db, "bad")).toThrow("Invalid fresh-auth storage key");
  const store = createPostgresFreshAuthStore(db, key);
  expect(await store.take("bad", browserBinding)).toBeNull();
  expect(await store.take(key, "bad")).toBeNull();
  await expect(store.issue({ userId: "bad", sessionId, browserBinding })).rejects.toThrow(
    "Invalid fresh-auth issuance input",
  );
});

test("malformed or ambiguous database responses fail closed", async () => {
  for (const rows of [
    [row, row],
    [undefined],
    [{ ...row, user_id: "bad" }],
    [{ ...row, started_ms: "NaN" }],
    [{ ...row, expires_ms: "601001" }],
    [{ ...row, expires_ms: "1000" }],
    [{ ...row, expires_ms: "9007199254740992" }],
  ]) {
    const store = createPostgresFreshAuthStore({ query: async () => ({ rows }) }, key);
    await expect(store.take(key, browserBinding)).rejects.toThrow("Invalid fresh-auth storage");
  }
});

test("issuance requires explicit success and storage failures propagate", async () => {
  const store = createPostgresFreshAuthStore(
    { query: async () => ({ rows: [{ issued: false }] }) },
    key,
  );
  await expect(store.issue({ userId, sessionId, browserBinding })).rejects.toThrow(
    "Fresh-auth issuance failed",
  );
  const unavailable = createPostgresFreshAuthStore(
    {
      async query() {
        throw new Error("unavailable");
      },
    },
    key,
  );
  await expect(unavailable.take(key, browserBinding)).rejects.toThrow("unavailable");
});
