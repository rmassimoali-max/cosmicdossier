import { describe, expect, test } from "bun:test";
import { consumeSessionDeletionAuthorization } from "./deletion-session-consume.server";
import { createSessionAuthorizationStorage } from "./deletion-session-storage.server";
import { createPostgresDeletionAuthorizationStorage } from "./deletion-postgres-storage.server";

function setup() {
  const slots = new Map();
  const queries = [];
  const input = {
    authUrl: "https://project.supabase.co",
    publishableKey: "public-key",
    accessToken: "session-a",
    encryptionKey: Buffer.alloc(32, 1),
    fetcher: async () =>
      new Response(
        JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          email: "verified@example.com",
          email_confirmed_at: "2026-11-24T10:00:00Z",
          is_anonymous: false,
        }),
      ),
    db: {
      async query(sql, params) {
        queries.push(sql);
        if (sql.includes("put_deletion_session_authorization")) {
          slots.set(params[0], params[1]);
          return { rows: [{ stored: true }] };
        }
        if (sql.includes("take_deletion_session_authorization")) {
          const envelope = slots.get(params[0]) ?? null;
          slots.delete(params[0]);
          return { rows: [{ envelope }] };
        }
        return { rows: [{ consumed: true }] };
      },
    },
  };
  const save = () =>
    createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(input.db),
      key: input.encryptionKey,
      sessionToken: input.accessToken,
    }).save({
      authorizationId: "33333333-3333-4333-8333-333333333333",
      authorizationSecret: "a".repeat(64),
    });
  return { input, save, queries };
}

describe("session-scoped deletion consumption", () => {
  test("rejects another session of the same account without consuming the owner proof", async () => {
    const { input, save, queries } = setup();
    await save();
    expect(await consumeSessionDeletionAuthorization({ ...input, accessToken: "session-b" })).toBe(
      false,
    );
    expect(queries).toHaveLength(2);
    expect(await consumeSessionDeletionAuthorization(input)).toBe(true);
    expect(queries).toHaveLength(4);
    expect(await consumeSessionDeletionAuthorization(input)).toBe(false);
    expect(queries).toHaveLength(5);
  });

  test("rejects missing authorization without calling the consumption function", async () => {
    const { input, queries } = setup();
    expect(await consumeSessionDeletionAuthorization(input)).toBe(false);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain("take_deletion_session_authorization");
  });

  test("rejects invalid authentication before touching storage", async () => {
    const { input, save, queries } = setup();
    await save();
    await expect(
      consumeSessionDeletionAuthorization({
        ...input,
        fetcher: async () => new Response("{}", { status: 401 }),
      }),
    ).rejects.toThrow();
    expect(queries).toHaveLength(1);
    expect(await consumeSessionDeletionAuthorization(input)).toBe(true);
  });
});
