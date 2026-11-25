import { describe, expect, test } from "bun:test";
import { handleStoredDeletionVerification } from "./deletion-http-stored-verification.server";

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
  const saved = [];
  const queries = [];
  return {
    saved,
    queries,
    request: new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: {
        origin: "https://www.cosmicdossier.com",
        host: "www.cosmicdossier.com",
      },
      body: JSON.stringify({ challengeId, code: "12345678" }),
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
    storeAuthorization: async (authorization) => {
      saved.push(authorization);
    },
  };
}

describe("stored deletion verification HTTP handoff", () => {
  test("stores authorization server-side and returns only a boolean", async () => {
    const input = setup();
    const response = await handleStoredDeletionVerification(input);
    expect(response).toEqual({ verified: true });
    expect(input.saved).toHaveLength(1);
    expect(input.saved[0].authorizationId).toBe(authorizationId);
    expect(input.saved[0].authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(response)).not.toContain(authorizationId);
    expect(JSON.stringify(response)).not.toContain(input.saved[0].authorizationSecret);
  });

  test("storage failure cannot acknowledge verification", async () => {
    const input = setup();
    input.storeAuthorization = async () => {
      throw new Error("secure storage unavailable");
    };
    await expect(handleStoredDeletionVerification(input)).rejects.toThrow("storage unavailable");
    expect(input.queries).toHaveLength(1);
  });

  test("invalid session never writes authorization", async () => {
    const input = setup();
    input.getSessionToken = () => null;
    await expect(handleStoredDeletionVerification(input)).rejects.toThrow("sign in");
    expect(input.saved).toHaveLength(0);
    expect(input.queries).toHaveLength(0);
  });

  test("disabled backend never writes authorization", async () => {
    const input = setup();
    input.env = {};
    await expect(handleStoredDeletionVerification(input)).rejects.toThrow("not enabled");
    expect(input.saved).toHaveLength(0);
    expect(input.queries).toHaveLength(0);
  });
});
