import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { consumePreflightedDeletionAuthorization } from "./deletion-consumption.server";

const userId = "11111111-1111-4111-8111-111111111111";
const authorizationId = "33333333-3333-4333-8333-333333333333";
const authorizationSecret = "a".repeat(64);
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
    authorizationId,
    authorizationSecret,
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
        return { rows: [{ consumed: true }] };
      },
    },
  };
}

describe("preflighted deletion authorization consumption", () => {
  test("consumes only for the authenticated identity using a secret digest", async () => {
    const input = setup();
    expect(await consumePreflightedDeletionAuthorization(input)).toBe(true);
    expect(input.queries).toHaveLength(1);
    expect(input.queries[0].params).toEqual([
      authorizationId,
      userId,
      createHash("sha256").update(authorizationSecret).digest("hex"),
    ]);
    expect(JSON.stringify(input.queries)).not.toContain(authorizationSecret);
  });

  test("disabled backend blocks consumption", async () => {
    const input = setup();
    input.env = {};
    await expect(consumePreflightedDeletionAuthorization(input)).rejects.toThrow("not enabled");
    expect(input.queries).toHaveLength(0);
  });

  test("cross-origin requests cannot consume authorization", async () => {
    const input = setup();
    input.origin = "https://evil.example";
    await expect(consumePreflightedDeletionAuthorization(input)).rejects.toThrow("origin");
    expect(input.queries).toHaveLength(0);
  });

  test("invalid sessions cannot consume authorization", async () => {
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(consumePreflightedDeletionAuthorization(input)).rejects.toThrow();
    expect(input.queries).toHaveLength(0);
  });

  test("malformed authorization is rejected without querying SQL", async () => {
    const input = setup();
    input.authorizationSecret = "invalid";
    expect(await consumePreflightedDeletionAuthorization(input)).toBe(false);
    expect(input.queries).toHaveLength(0);
  });

  test("already-used or other-account authorizations fail closed", async () => {
    const input = setup();
    input.db.query = async (sql, params) => {
      input.queries.push({ sql, params });
      return { rows: [{ consumed: false }] };
    };
    expect(await consumePreflightedDeletionAuthorization(input)).toBe(false);
    expect(input.queries).toHaveLength(1);
  });
});
