import { describe, expect, test } from "bun:test";
import {
  generateDeletionEmailCode,
  hashDeletionEmailCode,
  readDeletionCodeSecret,
} from "./deletion-code.server";

const userId = "11111111-1111-4111-8111-111111111111";
const challengeId = "22222222-2222-4222-8222-222222222222";
const secret = Buffer.alloc(32, 7);

describe("server-only deletion email codes", () => {
  test("generates exactly eight digits, including leading zeroes when needed", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateDeletionEmailCode()).toMatch(/^\d{8}$/);
    }
  });

  test("requires a distinct sufficiently strong server secret", () => {
    expect(readDeletionCodeSecret({})).toBeNull();
    expect(() => readDeletionCodeSecret({ DELETION_CODE_HMAC_SECRET: "weak" })).toThrow();
    expect(
      readDeletionCodeSecret({ DELETION_CODE_HMAC_SECRET: "ab".repeat(32) }),
    ).toHaveLength(32);
  });

  test("binds code digest to user, challenge, and secret", () => {
    const first = hashDeletionEmailCode(secret, userId, challengeId, "00123456");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(hashDeletionEmailCode(secret, userId, challengeId, "00123456"));
    expect(first).not.toBe(
      hashDeletionEmailCode(secret, userId, "33333333-3333-4333-8333-333333333333", "00123456"),
    );
    expect(first).not.toBe(
      hashDeletionEmailCode(secret, "44444444-4444-4444-8444-444444444444", challengeId, "00123456"),
    );
    expect(first).not.toBe(hashDeletionEmailCode(Buffer.alloc(32, 8), userId, challengeId, "00123456"));
  });

  test("rejects malformed context and short secrets", () => {
    expect(() => hashDeletionEmailCode(secret, userId, challengeId, "123")).toThrow();
    expect(() => hashDeletionEmailCode(Buffer.alloc(8), userId, challengeId, "12345678")).toThrow();
  });
});
