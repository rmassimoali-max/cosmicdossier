import { describe, expect, test } from "bun:test";
import { resolveDeletionIdentity } from "./deletion-auth.server";

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.com",
  email_confirmed_at: "2026-11-24T10:00:00Z",
  is_anonymous: false,
};
const config = {
  authUrl: "https://project.supabase.co",
  publishableKey: "public-key",
  accessToken: "session-token",
};

describe("server-side deletion identity resolution", () => {
  test("uses Supabase Auth user endpoint and returns only verified identity", async () => {
    const calls = [];
    const result = await resolveDeletionIdentity({
      ...config,
      fetcher: async (url, options) => {
        calls.push({ url, options });
        return new Response(JSON.stringify(account), { status: 200 });
      },
    });
    expect(result).toEqual({ userId: account.id, verifiedEmail: account.email });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://project.supabase.co/auth/v1/user");
    expect(calls[0].options.headers.Authorization).toBe("Bearer session-token");
    expect(calls[0].options.cache).toBe("no-store");
  });

  test("rejects invalid sessions without accepting client profile claims", async () => {
    for (const status of [401, 403, 500]) {
      await expect(
        resolveDeletionIdentity({
          ...config,
          fetcher: async () => new Response("{}", { status }),
        }),
      ).rejects.toThrow("Could not verify");
    }
  });

  test("rejects unconfirmed and malformed authentication responses", async () => {
    for (const payload of [null, [], {}, { ...account, email_confirmed_at: null }]) {
      await expect(
        resolveDeletionIdentity({
          ...config,
          fetcher: async () => new Response(JSON.stringify(payload)),
        }),
      ).rejects.toThrow();
    }
  });

  test("fails before network access when session is missing", async () => {
    let called = false;
    await expect(
      resolveDeletionIdentity({
        ...config,
        accessToken: "",
        fetcher: async () => {
          called = true;
          return new Response(JSON.stringify(account));
        },
      }),
    ).rejects.toThrow("authenticated session");
    expect(called).toBe(false);
  });
});
