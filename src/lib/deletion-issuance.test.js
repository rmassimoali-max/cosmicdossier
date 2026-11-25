import { describe, expect, test } from "bun:test";
import { issuePreflightedDeletionChallenge } from "./deletion-issuance.server";

const userId = "11111111-1111-4111-8111-111111111111";
const email = "verified@example.com";
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
  const deliveries = [];
  return {
    queries,
    deliveries,
    env: enabled,
    method: "POST",
    origin: "https://www.cosmicdossier.com",
    host: "www.cosmicdossier.com",
    expectedOrigin: "https://www.cosmicdossier.com",
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    accessToken: "session-token",
    fetcher: async () =>
      new Response(
        JSON.stringify({
          id: userId,
          email,
          email_confirmed_at: "2026-11-24T10:00:00Z",
          is_anonymous: false,
        }),
      ),
    db: {
      async query(sql, params) {
        queries.push({ sql, params });
        if (sql.includes("issue_account_deletion_challenge")) {
          return { rows: [{ issued: true }] };
        }
        return { rows: [{ activated: true }] };
      },
    },
    sender: async (config, recipient, code) => {
      deliveries.push({ config, recipient, code });
      return { sent: true };
    },
  };
}

describe("preflighted deletion challenge issuance", () => {
  test("issues and activates only for the verified identity", async () => {
    const input = setup();
    const result = await issuePreflightedDeletionChallenge(input);
    expect(result.sent).toBe(true);
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/);
    expect(input.queries).toHaveLength(2);
    expect(input.queries[0].params[1]).toBe(userId);
    expect(input.queries[1].params[1]).toBe(userId);
    expect(input.deliveries).toHaveLength(1);
    expect(input.deliveries[0].recipient).toBe(email);
    expect(input.deliveries[0].code).toMatch(/^[0-9]{8}$/);
    expect(JSON.stringify(result)).not.toContain(input.deliveries[0].code);
    expect(JSON.stringify(input.queries)).not.toContain(input.deliveries[0].code);
  });

  test("disabled backend cannot query or send email", async () => {
    const input = setup();
    input.env = {};
    await expect(issuePreflightedDeletionChallenge(input)).rejects.toThrow("not enabled");
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });

  test("cross-origin requests cannot query or send email", async () => {
    const input = setup();
    input.origin = "https://evil.example";
    await expect(issuePreflightedDeletionChallenge(input)).rejects.toThrow("origin");
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });

  test("invalid sessions cannot query or send email", async () => {
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(issuePreflightedDeletionChallenge(input)).rejects.toThrow();
    expect(input.queries).toHaveLength(0);
    expect(input.deliveries).toHaveLength(0);
  });
});
