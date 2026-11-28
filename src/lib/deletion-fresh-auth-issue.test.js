import { expect, test } from "bun:test";
import { issueFreshAuthFlow } from "./deletion-fresh-auth-issue.server";
import { readFreshAuthBrowserBinding } from "./deletion-fresh-auth-browser.server";

const userId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const flowId = "a".repeat(64);

function auth(status = 200) {
  const claims = {
    sub: userId,
    session_id: sessionId,
    exp: Math.floor(Date.now() / 1000) + 60,
  };
  return {
    authUrl: "https://example.supabase.co",
    publishableKey: "test",
    accessToken: "e30." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".sig",
    fetcher: async () =>
      new Response(
        JSON.stringify({
          id: userId,
          email: "test@example.com",
          email_confirmed_at: "2026-01-01T00:00:00Z",
        }),
        { status },
      ),
  };
}

test("issuance persists verified identity and the server-generated cookie binding", async () => {
  let saved;
  const store = {
    async issue(input) {
      saved = input;
      return flowId;
    },
  };
  const result = await issueFreshAuthFlow({ auth: auth(), store });
  expect(result.flowId).toBe(flowId);
  expect(Object.keys(result).sort()).toEqual(["flowId", "setCookie"]);
  expect(saved).toEqual({
    userId,
    sessionId,
    browserBinding: readFreshAuthBrowserBinding(result.setCookie.split(";")[0]),
  });
});

test("provider rejection prevents storage issuance", async () => {
  let called = false;
  const store = {
    async issue() {
      called = true;
      return flowId;
    },
  };
  await expect(issueFreshAuthFlow({ auth: auth(401), store })).rejects.toThrow();
  expect(called).toBe(false);
});

test("storage failure or invalid flow ID prevents issuance", async () => {
  const unavailable = {
    async issue() {
      throw new Error("Unavailable");
    },
  };
  const invalid = {
    async issue() {
      return "invalid";
    },
  };
  await expect(issueFreshAuthFlow({ auth: auth(), store: unavailable })).rejects.toThrow();
  await expect(issueFreshAuthFlow({ auth: auth(), store: invalid })).rejects.toThrow();
});
