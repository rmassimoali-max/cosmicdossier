import { describe, expect, test } from "bun:test";
import { handleDeletionCodeVerification } from "./deletion-http-verification.server";

const userId = "11111111-1111-4111-8111-111111111111";
const challengeId = "22222222-2222-4222-8222-222222222222";
const authorizationId = "33333333-3333-4333-8333-333333333333";
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
    request: new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: {
        origin: "https://www.cosmicdossier.com",
        host: "www.cosmicdossier.com",
      },
      body: JSON.stringify({
        challengeId,
        code: "12345678",
        userId: "spoofed-user",
        email: "attacker@example.com",
      }),
    }),
    env: enabled,
    expectedOrigin: "https://www.cosmicdossier.com",
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    getSessionToken: () => "server-cookie-token",
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

describe("server-only deletion code verification HTTP adapter", () => {
  test("binds exchange to verified account, never spoofed body identity", async () => {
    const input = setup();
    const result = await handleDeletionCodeVerification(input);
    expect(result.authorizationId).toBe(authorizationId);
    expect(result.authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(input.queries).toHaveLength(1);
    expect(input.queries[0].params[0]).toBe(challengeId);
    expect(input.queries[0].params[1]).toBe(userId);
    expect(JSON.stringify(input.queries)).not.toContain("spoofed-user");
    expect(JSON.stringify(input.queries)).not.toContain("12345678");
  });

  test("rejects absent session before SQL", async () => {
    const input = setup();
    input.getSessionToken = () => null;
    await expect(handleDeletionCodeVerification(input)).rejects.toThrow("sign in");
    expect(input.queries).toHaveLength(0);
  });

  test("rejects cross-origin request before SQL", async () => {
    const input = setup();
    input.request = new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "www.cosmicdossier.com" },
      body: JSON.stringify({ challengeId, code: "12345678" }),
    });
    await expect(handleDeletionCodeVerification(input)).rejects.toThrow("origin");
    expect(input.queries).toHaveLength(0);
  });

  test("rejects malformed JSON before SQL", async () => {
    const input = setup();
    input.request = new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: {
        origin: "https://www.cosmicdossier.com",
        host: "www.cosmicdossier.com",
      },
      body: "not-json",
    });
    await expect(handleDeletionCodeVerification(input)).rejects.toThrow("Invalid verification");
    expect(input.queries).toHaveLength(0);
  });

  test("rejects disabled backend before SQL", async () => {
    const input = setup();
    input.env = {};
    await expect(handleDeletionCodeVerification(input)).rejects.toThrow("not enabled");
    expect(input.queries).toHaveLength(0);
  });

  test("rejects malformed code before SQL", async () => {
    const input = setup();
    input.request = new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: {
        origin: "https://www.cosmicdossier.com",
        host: "www.cosmicdossier.com",
      },
      body: JSON.stringify({ challengeId, code: "bad" }),
    });
    await expect(handleDeletionCodeVerification(input)).rejects.toThrow("eight-digit");
    expect(input.queries).toHaveLength(0);
  });
});
