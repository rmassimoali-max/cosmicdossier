import { expect, test } from "bun:test";
import {
  createSessionStateReader,
  SESSION_STATE_SQL,
} from "./deletion-fresh-auth-session-state.server";

const identity = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
};
const row = {
  user_id: identity.userId,
  session_id: identity.sessionId,
  created_ms: "1000",
  refreshed_ms: "2000",
  expires_ms: null,
};

test("reads only bound session timing metadata", async () => {
  const read = createSessionStateReader({
    async query(sql, params) {
      expect(sql).toBe(SESSION_STATE_SQL);
      expect(params).toEqual([identity.sessionId, identity.userId]);
      return { rows: [row] };
    },
  });
  expect(await read(identity)).toEqual({
    ...identity,
    createdAt: 1000,
    lastActivityAt: 2000,
    notAfter: null,
  });
});

test("rejects missing, ambiguous, mismatched or malformed session state", async () => {
  for (const rows of [
    [],
    [row, row],
    [{ ...row, user_id: "other" }],
    [{ ...row, refreshed_ms: null }],
    [{ ...row, expires_ms: undefined }],
    [{ ...row, created_ms: "NaN" }],
  ]) {
    const read = createSessionStateReader({ query: async () => ({ rows }) });
    expect(await read(identity)).toBeNull();
  }
});
