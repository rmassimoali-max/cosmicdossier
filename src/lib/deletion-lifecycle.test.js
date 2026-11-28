import { describe, expect, test } from "bun:test";
import { handleDeletionCodeRequest } from "./deletion-http-request.server";
import { handlePostgresStoredDeletionVerification } from "./deletion-http-postgres-verification.server";
import { createPostgresDeletionAuthorizationStorage } from "./deletion-postgres-storage.server";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";
import { consumeAuthenticatedDeletionAuthorization } from "./deletion-authenticated-consume.server";

describe("deletion authorization lifecycle (simulated dependencies)", () => {
  test("issues, verifies, stores and consumes only once for the authenticated account", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const authorizationId = "33333333-3333-4333-8333-333333333333";
    const origin = "https://www.cosmicdossier.com";
    const token = "fixture-session";
    const encryptionKey = Buffer.alloc(32, 7);
    const entries = new Map();
    let challenge;
    let authorization;
    let code;
    const db = {
      async query(sql, params) {
        if (sql.includes("issue_account_deletion_challenge")) {
          challenge = { id: params[0], user: params[1], hash: params[2], active: false };
          return { rows: [{ issued: true }] };
        }
        if (sql.includes("activate_account_deletion_challenge")) {
          expect(params).toEqual([challenge.id, challenge.user]);
          challenge.active = true;
          return { rows: [{ activated: true }] };
        }
        if (sql.includes("exchange_account_deletion_challenge")) {
          const valid =
            challenge.active &&
            params[0] === challenge.id &&
            params[1] === challenge.user &&
            params[2] === challenge.hash;
          if (!valid) return { rows: [{ authorization_id: null }] };
          challenge.active = false;
          authorization = { hash: params[3], consumed: false };
          return { rows: [{ authorization_id: authorizationId }] };
        }
        if (sql.includes("put_deletion_session_authorization")) {
          entries.set(params[0], params[1]);
          return { rows: [{ stored: true }] };
        }
        if (sql.includes("take_deletion_session_authorization")) {
          const envelope = entries.get(params[0]) ?? null;
          entries.delete(params[0]);
          return { rows: [{ envelope }] };
        }
        if (sql.includes("consume_account_deletion_authorization")) {
          const consumed =
            !authorization.consumed &&
            params[0] === authorizationId &&
            params[1] === userId &&
            params[2] === authorization.hash;
          if (consumed) authorization.consumed = true;
          return { rows: [{ consumed }] };
        }
        throw new Error("Unexpected SQL");
      },
    };
    const input = {
      env: {
        ACCOUNT_DELETION_BACKEND_ENABLED: "true",
        DELETION_DATABASE_URL:
          "postgresql://deletion_worker:example@db.example.com:5432/postgres?sslmode=verify-full",
        DELETION_CODE_HMAC_SECRET: "ab".repeat(32),
        RESEND_API_KEY: "re_example",
        DELETION_EMAIL_FROM: "Cosmic Dossier <security@example.com>",
      },
      expectedOrigin: origin,
      authUrl: "https://project.supabase.co",
      publishableKey: "public-key",
      getSessionToken: () => token,
      fetcher: async () =>
        new Response(
          JSON.stringify({
            id: userId,
            email: "verified@example.com",
            email_confirmed_at: "2026-11-24T10:00:00Z",
            is_anonymous: false,
          }),
        ),
      db,
    };
    const request = (body) =>
      new Request(origin + "/account", {
        method: "POST",
        headers: { origin, host: "www.cosmicdossier.com" },
        body: JSON.stringify(body),
      });
    const issued = await handleDeletionCodeRequest({
      ...input,
      request: request({}),
      sender: async (_config, recipient, deliveredCode) => {
        expect(recipient).toBe("verified@example.com");
        code = deliveredCode;
        return { sent: true };
      },
    });
    expect(issued.sent).toBe(true);
    expect(JSON.stringify(issued)).not.toContain(code);
    const verify = () =>
      handlePostgresStoredDeletionVerification({
        ...input,
        encryptionKey,
        request: request({ challengeId: issued.challengeId, code }),
      });
    expect(await verify()).toEqual({ verified: true });
    await expect(verify()).rejects.toThrow();
    const storage = (sessionToken) =>
      createSessionAuthorizationStorage({
        storage: createPostgresDeletionAuthorizationStorage(db),
        key: encryptionKey,
        sessionToken,
      });
    expect(await storage("other-session").take()).toBeNull();
    const credentials = await storage(token).take();
    expect(credentials.authorizationId).toBe(authorizationId);
    expect(await storage(token).take()).toBeNull();
    const consume = () =>
      consumeAuthenticatedDeletionAuthorization({
        ...input,
        accessToken: token,
        ...credentials,
      });
    expect(await consume()).toBe(true);
    expect(await consume()).toBe(false);
  });
});
