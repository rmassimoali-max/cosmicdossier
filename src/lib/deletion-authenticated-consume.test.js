import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { consumeAuthenticatedDeletionAuthorization } from "./deletion-authenticated-consume.server";

const userId = "11111111-1111-4111-8111-111111111111";
const authorizationId = "33333333-3333-4333-8333-333333333333";
const authorizationSecret = "a".repeat(64);
const identity = {
  id: userId,
  email: "verified@example.com",
  email_confirmed_at: "2026-11-24T10:00:00Z",
  is_anonymous: false,
};

function setup(payload = identity) {
  const queries = [];
  return {
    queries,
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    accessToken: "session-token",
    authorizationId,
    authorizationSecret,
    fetcher: async () => new Response(JSON.stringify(payload)),
    db: {
      async query(sql, params) {
        queries.push({ sql, params });
        return { rows: [{ consumed: true }] };
      },
    },
  };
}

describe("authenticated deletion authorization consumption", () => {
  test("consumes for the verified account using only a digest in SQL", async () => {
    const input = setup();
    expect(await consumeAuthenticatedDeletionAuthorization(input)).toBe(true);
    expect(input.queries).toHaveLength(1);
    expect(input.queries[0].params).toEqual([
      authorizationId,
      userId,
      createHash("sha256").update(authorizationSecret).digest("hex"),
    ]);
    expect(JSON.stringify(input.queries)).not.toContain(authorizationSecret);
  });

  test("rejects malformed credentials before authentication or SQL", async () => {
    for (const [badId, badSecret] of [
      ["not-a-uuid", authorizationSecret],
      [authorizationId, "invalid"],
      [authorizationId, "A".repeat(64)],
    ]) {
      const input = setup();
      let authCalled = false;
      input.authorizationId = badId;
      input.authorizationSecret = badSecret;
      input.fetcher = async () => {
        authCalled = true;
        return new Response(JSON.stringify(identity));
      };
      expect(await consumeAuthenticatedDeletionAuthorization(input)).toBe(false);
      expect(authCalled).toBe(false);
      expect(input.queries).toHaveLength(0);
    }
  });

  test("does not query SQL for invalid or unconfirmed sessions", async () => {
    for (const payload of [
      { ...identity, email_confirmed_at: null },
      { ...identity, is_anonymous: true },
    ]) {
      const input = setup(payload);
      await expect(consumeAuthenticatedDeletionAuthorization(input)).rejects.toThrow();
      expect(input.queries).toHaveLength(0);
    }
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(consumeAuthenticatedDeletionAuthorization(input)).rejects.toThrow();
    expect(input.queries).toHaveLength(0);
  });

  test("returns false for already-consumed or cross-account authorizations", async () => {
    const input = setup();
    input.db.query = async (sql, params) => {
      input.queries.push({ sql, params });
      return { rows: [{ consumed: false }] };
    };
    expect(await consumeAuthenticatedDeletionAuthorization(input)).toBe(false);
    expect(input.queries).toHaveLength(1);
  });
});
