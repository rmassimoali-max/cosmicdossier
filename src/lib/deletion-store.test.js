import { describe, expect, test } from "bun:test";
import { createDeletionChallengeStore } from "./deletion-store.server";

const id = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const expiresAt = new Date("2026-11-24T12:10:00Z");

describe("server-only deletion challenge SQL adapter", () => {
  test("uses bound parameters and accepts successful issuance", async () => {
    const calls = [];
    const store = createDeletionChallengeStore({
      async query(statement, params) {
        calls.push({ statement, params });
        return { rows: [{ issued: true }] };
      },
    });
    await store.create({ id, userId, tokenHash: "a".repeat(64), expiresAt });
    expect(calls).toHaveLength(1);
    expect(calls[0].statement).toContain("private.issue_account_deletion_challenge");
    expect(calls[0].statement).toContain("$1::uuid");
    expect(calls[0].params).toEqual([id, userId, "a".repeat(64), expiresAt]);
    expect(calls[0].statement).not.toContain(userId);
  });

  test("rejects throttled issuance without emailing", async () => {
    const store = createDeletionChallengeStore({
      async query() {
        return { rows: [{ issued: false }] };
      },
    });
    await expect(
      store.create({ id, userId, tokenHash: "a".repeat(64), expiresAt }),
    ).rejects.toThrow("unavailable");
  });

  test("activates only a matching challenge through the private function", async () => {
    const calls = [];
    const store = createDeletionChallengeStore({
      async query(statement, params) {
        calls.push({ statement, params });
        return { rows: [{ activated: true }] };
      },
    });
    await store.activate(id, userId);
    expect(calls[0].statement).toContain("private.activate_account_deletion_challenge");
    expect(calls[0].params).toEqual([id, userId]);
  });

  test("revokes only the matching account challenge", async () => {
    const calls = [];
    const store = createDeletionChallengeStore({
      async query(statement, params) {
        calls.push({ statement, params });
        return { rows: [{ id }] };
      },
    });
    await store.revoke(id, userId);
    expect(calls[0].statement).toContain("consumed_at is null");
    expect(calls[0].statement).toContain("user_id = $2::uuid");
    expect(calls[0].params).toEqual([id, userId]);
  });

  test("fails closed when revocation affects no row", async () => {
    const store = createDeletionChallengeStore({
      async query() {
        return { rows: [] };
      },
    });
    await expect(store.revoke(id, userId)).rejects.toThrow("Could not revoke");
  });
});
