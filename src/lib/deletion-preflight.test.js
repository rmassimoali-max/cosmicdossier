import { describe, expect, test } from "bun:test";
import { requireDeletionVerificationPreflight } from "./deletion-preflight.server";

const enabled = {
  ACCOUNT_DELETION_BACKEND_ENABLED: "true",
  DELETION_DATABASE_URL:
    "postgresql://deletion_worker:example@db.example.com:5432/postgres?sslmode=verify-full",
  DELETION_CODE_HMAC_SECRET: "ab".repeat(32),
  RESEND_API_KEY: "re_example",
  DELETION_EMAIL_FROM: "Cosmic Dossier <security@example.com>",
};
const identity = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "verified@example.com",
  email_confirmed_at: "2026-11-24T10:00:00Z",
  is_anonymous: false,
};
const valid = {
  env: enabled,
  method: "POST",
  origin: "https://www.cosmicdossier.com",
  host: "www.cosmicdossier.com",
  expectedOrigin: "https://www.cosmicdossier.com",
  authUrl: "https://project.supabase.co",
  publishableKey: "public-key",
  accessToken: "session-token",
};

describe("deletion verification preflight", () => {
  test("fails closed before network access when backend is disabled", async () => {
    let called = false;
    await expect(
      requireDeletionVerificationPreflight({
        ...valid,
        env: {},
        fetcher: async () => {
          called = true;
          return new Response(JSON.stringify(identity));
        },
      }),
    ).rejects.toThrow("not enabled");
    expect(called).toBe(false);
  });

  test("rejects cross-site POST before contacting Supabase", async () => {
    let called = false;
    await expect(
      requireDeletionVerificationPreflight({
        ...valid,
        origin: "https://evil.example",
        fetcher: async () => {
          called = true;
          return new Response(JSON.stringify(identity));
        },
      }),
    ).rejects.toThrow("origin");
    expect(called).toBe(false);
  });

  test("requires a valid authenticated, confirmed account", async () => {
    await expect(
      requireDeletionVerificationPreflight({
        ...valid,
        fetcher: async () => new Response("{}", { status: 401 }),
      }),
    ).rejects.toThrow("verify");
  });

  test("returns trusted identity and server-only config when checks pass", async () => {
    const result = await requireDeletionVerificationPreflight({
      ...valid,
      fetcher: async () => new Response(JSON.stringify(identity)),
    });
    expect(result.identity).toEqual({
      userId: identity.id,
      verifiedEmail: identity.email,
    });
    expect(result.backend.secret).toHaveLength(32);
  });
});
