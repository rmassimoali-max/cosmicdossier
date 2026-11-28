import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import {
  consumeDeletionAuthorization,
  exchangeDeletionEmailCode,
} from "./deletion-exchange.server";
import { hashDeletionEmailCode } from "./deletion-code.server";

const userId = "11111111-1111-4111-8111-111111111111";
const challengeId = "22222222-2222-4222-8222-222222222222";
const authorizationId = "33333333-3333-4333-8333-333333333333";
const secret = Buffer.alloc(32, 7);
const code = "00123456";

describe("server-only deletion code exchange", () => {
  test("binds challenge hash and authorization hash without passing raw secrets to SQL", async () => {
    const calls = [];
    const db = {
      async query(statement, params) {
        calls.push({ statement, params });
        return { rows: [{ authorization_id: authorizationId }] };
      },
    };
    const result = await exchangeDeletionEmailCode({
      db,
      secret,
      userId,
      challengeId,
      code,
    });
    expect(result.authorizationId).toBe(authorizationId);
    expect(result.authorizationSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(calls).toHaveLength(1);
    expect(calls[0].statement).toContain("private.exchange_account_deletion_challenge");
    expect(calls[0].params[0]).toBe(challengeId);
    expect(calls[0].params[1]).toBe(userId);
    expect(calls[0].params[2]).toBe(hashDeletionEmailCode(secret, userId, challengeId, code));
    expect(calls[0].params[3]).toBe(
      createHash("sha256").update(result.authorizationSecret).digest("hex"),
    );
    expect(JSON.stringify(calls)).not.toContain(code);
    expect(JSON.stringify(calls)).not.toContain(result.authorizationSecret);
  });

  test("does not return authorization secrets when exchange is rejected", async () => {
    const db = {
      async query() {
        return { rows: [{ authorization_id: null }] };
      },
    };
    await expect(
      exchangeDeletionEmailCode({ db, secret, userId, challengeId, code }),
    ).rejects.toThrow("invalid, expired, or already used");
  });

  test("consumes authorization using its digest, never its raw secret", async () => {
    const authorizationSecret = "a".repeat(64);
    const calls = [];
    const db = {
      async query(statement, params) {
        calls.push({ statement, params });
        return { rows: [{ consumed: true }] };
      },
    };
    expect(
      await consumeDeletionAuthorization({
        db,
        userId,
        authorizationId,
        authorizationSecret,
      }),
    ).toBe(true);
    expect(calls[0].params).toEqual([
      authorizationId,
      userId,
      createHash("sha256").update(authorizationSecret).digest("hex"),
    ]);
    expect(JSON.stringify(calls)).not.toContain(authorizationSecret);
  });

  test("rejects malformed authorization before querying the database", async () => {
    let queried = false;
    const db = {
      async query() {
        queried = true;
        return { rows: [{ consumed: true }] };
      },
    };
    expect(
      await consumeDeletionAuthorization({
        db,
        userId,
        authorizationId,
        authorizationSecret: "invalid",
      }),
    ).toBe(false);
    expect(queried).toBe(false);
  });
});
