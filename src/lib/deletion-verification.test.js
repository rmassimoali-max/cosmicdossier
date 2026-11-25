import { describe, expect, test } from "bun:test";
import { hashDeletionEmailCode } from "./deletion-code.server";
import { verifyPreflightedDeletionCode } from "./deletion-verification.server";

const userId = "11111111-1111-4111-8111-111111111111";
const challengeId = "22222222-2222-4222-8222-222222222222";
const authorizationId = "33333333-3333-4333-8333-333333333333";
const code = "12345678";
const enabled = {
  ACCOUNT_DELETION_BACKEND_ENABLED: "true",
  DELETION_DATABASE_URL:
    "postgresql://deletion_worker:example@db.example.com:5432/postgres?sslmode=verify-full",
  DELETION_CODE_HMAC_SECRET: "ab".repeat(32),
  RESEND_API_KEY: "re_example",
  DELETION_EMAIL_FROM: "Cosmic Dossier <security@example.com>",
};

function setup() {
  const queries = [];
  return {
    queries,
    env: enabled,
    method: "POST",
    origin: "https://www.cosmicdossier.com",
    host: "www.cosmicdossier.com",
    expectedOrigin: "https://www.cosmicdossier.com",
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    accessToken: "session-token",
    challengeId,
    code,
    fetcher: async () =>
      new Response(
        JSON.stringify({
          id: userId,
          email: "verified@example.com",
          email_confirmed_at: "2026-11-24T10:00:00Z",
          is_anonymous: false,
        }),
      ),
    db: {
      async query(sql, params) {
        queries.push({ sql, params });
        return { rows: [{ authorization_id: authorizationId }] };
      },
    },
  };
}

describe("preflighted deletion code verification", () => {
  test("exchanges the code only for the authenticated user", async () => {
    const input = setup();
    const result = await verifyPreflightedDeletionCode(input);
    expect(result.authorizationId).toBe(authorizationId);
    expect(result.authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(input.queries).toHaveLength(1);
    expect(input.queries[0].params[0]).toBe(challengeId);
    expect(input.queries[0].params[1]).toBe(userId);
    expect(input.queries[0].params[2]).toBe(
      hashDeletionEmailCode(Buffer.from(enabled.DELETION_CODE_HMAC_SECRET, "hex"), userId, challengeId, code),
    );
    expect(JSON.stringify(input.queries)).not.toContain(code);
    expect(JSON.stringify(input.queries)).not.toContain(result.authorizationSecret);
  });

  test("disabled backend rejects verification before SQL", async () => {
    const input = setup();
    input.env = {};
    await expect(verifyPreflightedDeletionCode(input)).rejects.toThrow("not enabled");
    expect(input.queries).toHaveLength(0);
  });

  test("cross-origin verification is rejected before SQL", async () => {
    const input = setup();
    input.origin = "https://evil.example";
    await expect(verifyPreflightedDeletionCode(input)).rejects.toThrow("origin");
    expect(input.queries).toHaveLength(0);
  });

  test("malformed codes never reach SQL", async () => {
    for (const badCode of ["1234567", "123456789", "1234abcd"]) {
      const input = setup();
      input.code = badCode;
      await expect(verifyPreflightedDeletionCode(input)).rejects.toThrow("eight-digit");
      expect(input.queries).toHaveLength(0);
    }
  });

  test("invalid sessions cannot exchange codes", async () => {
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(verifyPreflightedDeletionCode(input)).rejects.toThrow();
    expect(input.queries).toHaveLength(0);
  });

  test("incorrect codes are rejected by the database attempt limit", async () => {
    const input = setup();
    input.db.query = async (sql, params) => {
      input.queries.push({ sql, params });
      return { rows: [{ authorization_id: null }] };
    };
    await expect(verifyPreflightedDeletionCode(input)).rejects.toThrow("invalid, expired");
    expect(input.queries).toHaveLength(1);
  });
});
