import { describe, expect, test } from "bun:test";
import { handlePostgresStoredDeletionVerification } from "./deletion-http-postgres-verification.server";
import { createPostgresDeletionAuthorizationStorage } from "./deletion-postgres-storage.server";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";

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

function persistentSetup() {
  const input = setup();
  const entries = new Map();
  const original = input.db.query;
  input.encryptionKey = Buffer.alloc(32, 7);
  input.db.query = async (sql, params) => {
    if (sql.includes("private.put_deletion_session_authorization")) {
      entries.set(params[0], params[1]);
      expect(params[2]).toBe(240000);
      return { rows: [{ stored: true }] };
    }
    if (sql.includes("private.take_deletion_session_authorization")) {
      const envelope = entries.get(params[0]) ?? null;
      entries.delete(params[0]);
      return { rows: [{ envelope }] };
    }
    return original(sql, params);
  };
  const session = (token = "server-cookie-token") =>
    createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(input.db),
      key: input.encryptionKey,
      sessionToken: token,
    });
  return { input, entries, session };
}

describe("persistent verification composition", () => {
  test("encrypts before persistence and returns only status", async () => {
    const { input, entries, session } = persistentSetup();
    expect(await handlePostgresStoredDeletionVerification(input)).toEqual({ verified: true });
    expect(entries.size).toBe(1);
    const [slot, envelope] = [...entries][0];
    expect(slot).toMatch(/^[0-9a-f]{64}$/);
    expect(envelope).not.toContain(authorizationId);
    expect(await session("other-session").take()).toBeNull();
    const authorization = await session().take();
    expect(authorization.authorizationId).toBe(authorizationId);
    expect(authorization.authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(await session().take()).toBeNull();
  });

  test("database refusal never acknowledges success", async () => {
    const { input } = persistentSetup();
    const query = input.db.query;
    input.db.query = async (sql, params) =>
      sql.includes("private.put_deletion_session_authorization")
        ? { rows: [{ stored: false }] }
        : query(sql, params);
    await expect(handlePostgresStoredDeletionVerification(input)).rejects.toThrow("Could not store");
  });

  test("invalid encryption key fails before consuming verification", async () => {
    const { input, entries } = persistentSetup();
    input.encryptionKey = Buffer.alloc(16);
    await expect(handlePostgresStoredDeletionVerification(input)).rejects.toThrow("not configured");
    expect(input.queries).toHaveLength(0);
    expect(entries.size).toBe(0);
  });

  test("disabled backend cannot persist", async () => {
    const { input, entries } = persistentSetup();
    input.env = {};
    await expect(handlePostgresStoredDeletionVerification(input)).rejects.toThrow("not enabled");
    expect(entries.size).toBe(0);
  });
});
