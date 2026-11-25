import { describe, expect, test } from "bun:test";
import { requestAuthenticatedDeletionChallenge } from "./deletion-authenticated-request.server";

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "verified@example.com",
  email_confirmed_at: "2026-11-24T10:00:00Z",
  is_anonymous: false,
};

function setup(user = account) {
  const events = [];
  const store = {
    async create(input) {
      events.push({ type: "create", ...input });
    },
    async activate(id, userId) {
      events.push({ type: "activate", id, userId });
    },
    async revoke(id, userId) {
      events.push({ type: "revoke", id, userId });
    },
  };
  return {
    events,
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    accessToken: "valid-session",
    store,
    emailConfig: { apiKey: "test-key", from: "security@example.com" },
    secret: Buffer.alloc(32, 3),
    fetcher: async () => new Response(JSON.stringify(user)),
    sender: async (_config, recipient, code) => {
      events.push({ type: "email", recipient, code });
      return { sent: true };
    },
  };
}

describe("authenticated deletion challenge request", () => {
  test("sends only to the Auth-confirmed email for the Auth-resolved user", async () => {
    const input = setup();
    const result = await requestAuthenticatedDeletionChallenge(input);
    expect(result.sent).toBe(true);
    expect(result.challengeId).toMatch(/^[0-9a-f-]{36}$/);
    const create = input.events.find((event) => event.type === "create");
    const email = input.events.find((event) => event.type === "email");
    const activate = input.events.find((event) => event.type === "activate");
    expect(create.userId).toBe(account.id);
    expect(email.recipient).toBe(account.email);
    expect(email.code).toMatch(/^[0-9]{8}$/);
    expect(activate.userId).toBe(account.id);
    expect(activate.id).toBe(create.id);
    expect(JSON.stringify(result)).not.toContain(email.code);
    expect(JSON.stringify(result)).not.toContain(create.tokenHash);
  });

  test("does not create or send when the Auth email is unconfirmed", async () => {
    const input = setup({ ...account, email_confirmed_at: null });
    await expect(requestAuthenticatedDeletionChallenge(input)).rejects.toThrow();
    expect(input.events).toHaveLength(0);
  });

  test("does not create or send when the session is rejected", async () => {
    const input = setup();
    input.fetcher = async () => new Response("{}", { status: 401 });
    await expect(requestAuthenticatedDeletionChallenge(input)).rejects.toThrow();
    expect(input.events).toHaveLength(0);
  });
});
