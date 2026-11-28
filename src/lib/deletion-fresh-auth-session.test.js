import { expect, test } from "bun:test";
import {
  resolveFreshAuthOriginalSession,
  resolveFreshAuthPasswordEvidence,
} from "./deletion-fresh-auth-session.server";

const userId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";

function fixture(overrides = {}, status = 200) {
  const claims = {
    sub: userId,
    session_id: sessionId,
    exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  };
  const accessToken = "e30." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".sig";
  return {
    authUrl: "https://example.supabase.co",
    publishableKey: "test",
    accessToken,
    fetcher: async (_url, options) => {
      expect(options.headers.Authorization).toBe("Bearer " + accessToken);
      return new Response(
        JSON.stringify({
          id: userId,
          email: "test@example.com",
          email_confirmed_at: "2026-01-01T00:00:00Z",
        }),
        { status },
      );
    },
  };
}

test("original session requires provider validation of the same token", async () => {
  expect(await resolveFreshAuthOriginalSession(fixture())).toEqual({ userId, sessionId });
  await expect(resolveFreshAuthOriginalSession(fixture({}, 401))).rejects.toThrow();
});

test("original session rejects mismatched, missing and expired claims", async () => {
  for (const claims of [{ sub: "other" }, { session_id: null }, { exp: 0 }]) {
    await expect(resolveFreshAuthOriginalSession(fixture(claims))).rejects.toThrow();
  }
});

test("password evidence uses verified authentication time, not token issuance time", async () => {
  const timestamp = Math.floor(Date.now() / 1000) - 30;
  const input = fixture({
    amr: [{ method: "password", timestamp }],
    iat: timestamp + 20,
  });
  expect(await resolveFreshAuthPasswordEvidence(input)).toEqual({
    userId,
    sessionId,
    authenticatedAt: timestamp * 1000,
    method: "password",
  });
});

test("password evidence rejects provider denial and missing or future events", async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const amr = [{ method: "password", timestamp }];
  await expect(resolveFreshAuthPasswordEvidence(fixture({ amr }, 401))).rejects.toThrow();
  await expect(resolveFreshAuthPasswordEvidence(fixture())).rejects.toThrow();
  await expect(
    resolveFreshAuthPasswordEvidence(
      fixture({ amr: [{ method: "password", timestamp: timestamp + 600 }] }),
    ),
  ).rejects.toThrow();
});
