import { describe, expect, test } from "bun:test";
import { handleDeletionCodeRequest } from "./deletion-http-request.server";

const enabled = {
  ACCOUNT_DELETION_BACKEND_ENABLED: "true",
  DELETION_DATABASE_URL:
    "postgresql://deletion_worker:example@db.example.com:5432/postgres?sslmode=verify-full",
  DELETION_CODE_HMAC_SECRET: "ab".repeat(32),
  RESEND_API_KEY: "re_example",
  DELETION_EMAIL_FROM: "Cosmic Dossier <security@example.com>",
};
const userId = "11111111-1111-4111-8111-111111111111";

function setup() {
  const queries = [];
  const deliveries = [];
  return {
    queries,
    deliveries,
    request: new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: {
        origin: "https://www.cosmicdossier.com",
        host: "www.cosmicdossier.com",
      },
      body: JSON.stringify({ userId: "attacker-id", email: "attacker@example.com" }),
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
        return {
          rows: [
            sql.includes("issue_account_deletion_challenge")
              ? { issued: true }
              : { activated: true },
          ],
        };
      },
    },
    sender: async (_config, recipient, code) => {
      deliveries.push({ recipient, code });
      return { sent: true };
    },
  };
}

describe("server-only deletion HTTP request adapter", () => {
  test("ignores spoofed body identity and returns only public challenge metadata", async () => {
    const input = setup();
    const result = await handleDeletionCodeRequest(input);
    expect(result.sent).toBe(true);
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/);
    expect(input.queries[0].params[1]).toBe(userId);
    expect(input.deliveries[0].recipient).toBe("verified@example.com");
    expect(JSON.stringify(result)).not.toContain(input.deliveries[0].code);
    expect(JSON.stringify(result)).not.toContain("server-cookie-token");
  });

  test("rejects absent session before database or email", async () => {
    const input = setup();
    input.getSessionToken = () => null;
    await expect(handleDeletionCodeRequest(input)).rejects.toThrow("sign in");
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });

  test("rejects hostile Origin header before database or email", async () => {
    const input = setup();
    input.request = new Request("https://www.cosmicdossier.com/account", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "www.cosmicdossier.com" },
    });
    await expect(handleDeletionCodeRequest(input)).rejects.toThrow("origin");
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });

  test("rejects disabled backend before database or email", async () => {
    const input = setup();
    input.env = {};
    await expect(handleDeletionCodeRequest(input)).rejects.toThrow("not enabled");
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });
});
