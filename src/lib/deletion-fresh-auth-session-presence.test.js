import { expect, test } from "bun:test";
import {
  createSessionPresenceLookup,
  SESSION_PRESENCE_SQL,
} from "./deletion-fresh-auth-session-presence.server";

const identity = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
};

test("presence query binds both verified identifiers", async () => {
  const lookup = createSessionPresenceLookup({
    async query(sql, params) {
      expect(sql).toBe(SESSION_PRESENCE_SQL);
      expect(params).toEqual([identity.sessionId, identity.userId]);
      return { rows: [{ present: true }] };
    },
  });
  expect(await lookup(identity)).toBe(true);
});

test("missing or malformed presence results are rejected", async () => {
  for (const rows of [[], [{ present: false }], [{ present: "true" }], [{}, {}]]) {
    const lookup = createSessionPresenceLookup({ query: async () => ({ rows }) });
    expect(await lookup(identity)).toBe(false);
  }
});

test("invalid identifiers never reach the database", async () => {
  const lookup = createSessionPresenceLookup({
    async query() {
      throw new Error("Unexpected query");
    },
  });
  expect(await lookup({ ...identity, sessionId: "invalid" })).toBe(false);
});
