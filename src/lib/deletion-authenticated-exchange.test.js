import { describe, expect, test } from "bun:test";
import { hashDeletionEmailCode } from "./deletion-code.server";
import { exchangeAuthenticatedDeletionCode } from "./deletion-authenticated-exchange.server";

const userId = "11111111-1111-4111-8111-111111111111";
const challengeId = "22222222-2222-4222-8222-222222222222";
const code = "12345678";
const secret = Buffer.alloc(32, 7);
const identity = {
  id: userId,
  email: "confirmed@example.com",
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
    secret,
    challengeId,
    code,
    fetcher: async () => new Response(JSON.stringify(payload)),
    db: {
      async query(sql, params) {
        queries.push({ sql, params });
        return {
          rows: [{ authorization_id: "33333333-3333-4333-8333-333333333333" }],
        };
      },
    },
  };
}

describe("authenticated deletion code exchange", () => {
  test("binds code exchange to the user returned by Supabase Auth", async () => {
    const input = setup();
    const result = await exchangeAuthenticatedDeletionCode(input);
    expect(result.authorizationId).toBe("33333333-3333-4333-8333-333333333333");
    expect(result.authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(input.queries).toHaveLength(1);
    expect(input.queries[0].params[0]).toBe(challengeId);
    expect(input.queries[0].params[1]).toBe(userId);
    expect(input.queries[0].params[2]).toBe(
      hashDeletionEmailCode(secret, userId, challengeId, code),
    );
    expect(input.queries[0].params[3]).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(input.queries)).not.toContain(code);
  });

  test("rejects malformed challenge IDs and codes before Auth or SQL", async () => {
    for (const [badChallenge, badCode] of [
      ["not-a-uuid", code],
      [challengeId, "1234567"],
      [challengeId, "123456789"],
      [challengeId, "1234abcd"],
      [challengeId, "12345678\\n"],
    ]) {
      const input = setup();
      let authCalled = false;
      input.challengeId = badChallenge;
      input.code = badCode;
      input.fetcher = async () => {
        authCalled = true;
        return new Response(JSON.stringify(identity));
      };
      await expect(exchangeAuthenticatedDeletionCode(input)).rejects.toThrow(
        "valid deletion challenge",
      );
      expect(authCalled).toBe(false);
      expect(input.queries).toHaveLength(0);
    }
  });

  test("well-formed but incorrect codes still reach the database attempt limit", async () => {
    const input = setup();
    input.code = "87654321";
    input.db.query = async (sql, params) => {
      input.queries.push({ sql, params });
      return { rows: [{ authorization_id: null }] };
    };
    await expect(exchangeAuthenticatedDeletionCode(input)).rejects.toThrow(
      "invalid, expired, or already used",
    );
    expect(input.queries).toHaveLength(1);
  });

  test("does not access the database when the session is invalid", async () => {
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(exchangeAuthenticatedDeletionCode(input)).rejects.toThrow();
    expect(input.queries).toHaveLength(0);
  });

  test("does not access the database for unconfirmed or anonymous accounts", async () => {
    for (const payload of [
      { ...identity, email_confirmed_at: null },
      { ...identity, is_anonymous: true },
    ]) {
      const input = setup(payload);
      await expect(exchangeAuthenticatedDeletionCode(input)).rejects.toThrow();
      expect(input.queries).toHaveLength(0);
    }
  });
});
